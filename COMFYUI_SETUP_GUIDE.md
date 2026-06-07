# 🚀 Ultimate Guide: Connecting Local Backend to Cloud ComfyUI (Vast.ai)

This guide walks you through perfectly connecting your local AI Kiosk application to a remote GPU server running ComfyUI on Vast.ai. 

By following these instructions, you bypass the `401 Unauthorized` errors and properly link the Python (`FastAPI`) backend to your GPU.

---

## 🛑 Step 1: Find your ComfyUI Connection Link
Your local backend needs the exact external URL where your ComfyUI is visible. 

1. Go to your **Vast.ai Instance Portal**.
2. Look for the **Cloudflare Quick Tunnel** link under the ComfyUI application (it usually ends in `.trycloudflare.com`).
3. Click it to make sure ComfyUI loads in your browser.
4. **Copy this URL**. Ensure you remove the trailing slash (`/`) at the end.

---

## 🔑 Step 2: Get your Secret Authorization Token
By default, Vast.ai image templates protect the API with a strong, random password token. If you don't supply this, the Python backend will crash with a **`401 Unauthorized`** error when trying to upload images.

1. In your **Vast.ai Instance Portal**, find the button that says **Jupyter Terminal** (or SSH/CLI) and click it.
2. Once the black command-line terminal loads, type this exact command and hit Enter:
   ```bash
   echo $OPEN_BUTTON_TOKEN
   ```
3. The console will print out a highly randomized string (e.g., `d81c14645963...`).
4. **Copy this string**. This is your secret token.

---

## ⚙️ Step 3: Configure the Local `.env` File
Now you must tell your local python backend what the URL and Token are.

1. In your project, open the file `backend/.env`.
2. Update the two variables so they match your newly acquired information:
   ```env
   COMFYUI_URL=https://slowly-attributes-plymouth-handheld.trycloudflare.com
   COMFYUI_TOKEN=d81c1464596340029b0f8e2633ac4d5fc3731d73290485a68324f69167fb0854
   ```
*(Note: If you rent a new GPU or restart your instance, the URL and Token **WILL CHANGE**. You must repeat steps 1-3 every time you rent a totally new cloud machine!)*

---

## 📥 Step 4: Export the API Workflow Correctly 
If your backend successfully connects but gives you an error saying **`Prompt has no outputs`**, this means your ComfyUI graph was missing a finish line, or you exported it incorrectly.

1. Open your ComfyUI Cloudflare URL in your browser.
2. Load your working cloth-swapping setup.
3. Make absolutely sure there is a standard **`Save Image`** node attached to the very end of the pipeline.
4. In the ComfyUI menu box, do **NOT** click "Save". Instead, click **"Save (API format)"**.
5. Rename the downloaded file to exactly `workflow_api.json`.
6. Drop `workflow_api.json` into the root of this app codebase (replacing the old one).

---

## 🛠️ Step 5: Start the App!
Because your backend script (`backend/services/comfyui_client.py`) was specially upgraded, it automatically:
- Reads your custom `.env` tokens and passes them cleanly as `Authorization: Bearer <TOKEN>`.
- Parses the native API format.
- Randomizes the generation seed so the results are different.
- Auto-detects the `Save Image` node and pulls the result back down to the frontend.

Make sure your terminal is running:
```bash
# Terminal 1
cd backend
python main.py

# Terminal 2
npm run dev
```

That's it! Your physical Kiosk is perfectly bridged to your Cloud AI Engine.
