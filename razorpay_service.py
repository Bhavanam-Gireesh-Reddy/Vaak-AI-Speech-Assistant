import os
import hmac
import hashlib
import json
from datetime import datetime, timezone

try:
    import razorpay
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

# ── Razorpay Config ────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

# We enter MOCK_MODE if keys are missing
MOCK_MODE = not (bool(RAZORPAY_KEY_ID) and bool(RAZORPAY_KEY_SECRET))

client = None
if RAZORPAY_AVAILABLE and not MOCK_MODE:
    try:
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as e:
        print(f"⚠️ Razorpay Client init failed: {e}")
        MOCK_MODE = True

if MOCK_MODE:
    print("ℹ️ RAZORPAY MOCK MODE ACTIVE: Using simulated payment results.")

# ── One-Time Order (Lifetime Pro) ─────────────────────────────────────────────
def create_one_time_order(amount_in_inr: int, user_id: str):
    \"\"\"Creates a Razorpay Order for one-time payment (Amount in paise).\"\"\"
    if MOCK_MODE:
        return {
            "id": f"order_mock_{os.urandom(8).hex()}",
            "amount": amount_in_inr * 100,
            "currency": "INR",
            "notes": {"user_id": user_id, "type": "lifetime_pro"},
            "mock": True
        }
    
    data = {
        "amount": amount_in_inr * 100, # convert to paise
        "currency": "INR",
        "receipt": f"receipt_{user_id}_{int(datetime.now().timestamp())}",
        "notes": {
            "user_id": user_id,
            "type": "lifetime_pro"
        }
    }
    return client.order.create(data=data)

# ── Recurring Subscription (Monthly Pro) ──────────────────────────────────────
def create_monthly_subscription(plan_id: str, user_id: str):
    \"\"\"Creates a Razorpay Subscription for recurring payment.\"\"\"
    if MOCK_MODE:
        return {
            "id": f"sub_mock_{os.urandom(8).hex()}",
            "plan_id": plan_id or "plan_fake_123",
            "notes": {"user_id": user_id, "type": "monthly_pro"},
            "mock": True
        }
    
    # plan_id must be created in Razorpay Dashboard first
    data = {
        "plan_id": plan_id,
        "customer_notify": 1,
        "total_count": 12, # 1 year
        "notes": {
            "user_id": user_id,
            "type": "monthly_pro"
        }
    }
    return client.subscription.create(data=data)

# ── Verification ───────────────────────────────────────────────────────────────
def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    \"\"\"Verifies the signature sent by Razorpay Checkout for one-time orders.\"\"\"
    if MOCK_MODE and razorpay_signature == "mock_signature":
        return True
    
    if not RAZORPAY_AVAILABLE or not client:
        return False
        
    try:
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        return client.utility.verify_payment_signature(params_dict)
    except Exception:
        return False

def verify_subscription_signature(razorpay_subscription_id, razorpay_payment_id, razorpay_signature):
    \"\"\"Verifies the signature for recurring subscriptions.\"\"\"
    if MOCK_MODE and razorpay_signature == "mock_signature":
        return True
        
    if not client:
        return False

    try:
        # Signature is hmac_sha256(payment_id + "|" + subscription_id, secret)
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            (razorpay_payment_id + "|" + razorpay_subscription_id).encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(generated_signature, razorpay_signature)
    except Exception:
        return False
