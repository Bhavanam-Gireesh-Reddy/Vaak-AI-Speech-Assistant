import os, re
from datetime import datetime, timezone

# 1. Update main.py
with open('main.py', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# is_pro in register
if '"is_pro":' not in content:
    content = content.replace('"is_admin":      is_first,', '"is_admin":      is_first,\\n        "is_pro":        is_first,', 1)

# is_pro in me
if '"is_pro": bool(db_user.get("is_pro", False))' not in content:
    content = content.replace('"is_admin": bool(db_user.get("is_admin", False))', 
                             '"is_admin": bool(db_user.get("is_admin", False)),\\n        "is_pro": bool(db_user.get("is_pro", False) or db_user.get("is_admin", False))', 1)

# inject diarize pro check
diarize_ws_start = 'async def diarize_ws(client_ws: WebSocket):\\n    \"\"\"Real-time speaker diarization via Deepgram.\"\"\"\\n    await client_ws.accept()'
diarize_pro_check = \"\"\"
    # Auth & Pro Check
    ws_user_id = \"\"
    is_pro = False
    if AUTH_AVAILABLE:
        token = client_ws.query_params.get(\"token\") or client_ws.cookies.get(\"auth_token\")
        if token:
            payload = decode_token(token)
            if payload:
                ws_user_id = payload.get(\"sub\", \"\")
                if users_col:
                    db_user = await users_col.find_one({\"user_id\": ws_user_id})
                    if db_user:
                        is_pro = bool(db_user.get(\"is_pro\", False) or db_user.get(\"is_admin\", False))
    
    if not is_pro and ws_user_id != \"local\":
        await client_ws.send_json({\"type\": \"error\", \"message\": \"Speaker ID is a Pro feature. Please upgrade to unlock.\"});
        await client_ws.close()
        return

    start_time_limit = datetime.now(timezone.utc)
\"\"\"
if 'is_pro = False' not in content:
    content = content.replace(diarize_ws_start, diarize_ws_start + diarize_pro_check, 1)

# inject translate 5-min limit
# Need to find start_time_limit for translate_ws
translate_ws_start = 'async def translate_ws(client_ws: WebSocket):\\n    await client_ws.accept()'
translate_limit_code = \"\"\"
    start_time_limit = datetime.now(timezone.utc)
    is_pro = False # Initialize
    ws_user_id = \"\"
\"\"\"
if 'start_time_limit = datetime.now' not in content:
    content = content.replace(translate_ws_start, translate_ws_start + translate_limit_code, 1)

# Add limit check in diarize while loop
limit_check_diarize = \"\"\"
            # Free Limit: 5 min
            if not is_pro and ws_user_id != \"local\" and (datetime.now(timezone.utc) - start_time_limit).total_seconds() > 300:
                await client_ws.send_json({\"type\": \"error\", \"message\": \"Free 5-min limit reached. Upgrade to Pro for unlimited streaming.\"});
                break
\"\"\"
# Find a good place in the diarize generator loop
target_diarize_loop = 'async for result in stream_to_deepgram(audio_generator()):'
if 'Free 5-min limit reached' not in content:
    content = content.replace(target_diarize_loop, target_diarize_loop + limit_check_diarize, 1)

# Also update translate_ws pro status
translate_pro_marker = 'payload = decode_token(token)'
translate_pro_logic = \"\"\"
            payload = decode_token(token)
            if payload:
                ws_user_id = payload.get(\"sub\", \"\")
                if users_col:
                    db_user = await users_col.find_one({\"user_id\": ws_user_id})
                    if db_user:
                        is_pro = bool(db_user.get(\"is_pro\", False) or db_user.get(\"is_admin\", False))
\"\"\"
if 'ws_user_id = payload.get' in content:
    # We replace the original payload block
    content = re.sub(r'payload = decode_token\(token\)\s+if payload:\s+ws_user_id = payload\.get\("sub", ""\)', translate_pro_logic, content)

# Add limit check in translate loop
target_translate_loop = 'while True:' # Note: find first one after translate_ws
idx_translate = content.find('async def translate_ws')
idx_loop = content.find('while True:', idx_translate)
if idx_loop != -1 and 'Free 5-min limit reached' not in content:
    content = content[:idx_loop+11] + limit_check_diarize + content[idx_loop+11:]

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print(\"Backend logic (is_pro + Limit) implemented.\")
