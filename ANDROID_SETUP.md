# Android Guide (For Normal Users)

Yes, you can use the **same wallpaper link** on Android.

If your iPhone setup already gave you a wallpaper URL like:

`https://your-domain.com/api/wallpaper/xxxxxxxx?w=1290&h=2796`

you can copy that exact link and use it on Android.

You do not need to create a new account, code, or server for Android.

## What To Install

Install one of these:

1. **Tasker** (best option, more powerful)
2. **MacroDroid** (easier UI)

Optional fallback:

3. **KLWP** (only if your phone blocks automatic lock-screen wallpaper changes)

## Before You Start

1. Copy your wallpaper URL.
2. Open it once in Chrome on Android.
3. If an image opens, your link works.

If no image opens, the link is wrong or expired.

## Method A: Tasker (Recommended)

### Step 1: Create a daily trigger

1. Open **Tasker**.
2. Go to **Profiles**.
3. Tap **+**.
4. Choose **Time**.
5. Pick a daily time (example: 4:30 AM).
6. Go back and create a **New Task**.

### Step 2: Download wallpaper from your link

1. In the new task, tap **+** to add action.
2. Choose **Net** -> **HTTP Request**.
3. Set:
   - Method: `GET`
   - URL: paste your wallpaper URL
   - Save/output file: `/sdcard/Download/ramadan-wallpaper.png`
4. Save action.

### Step 3: Set that image as wallpaper

1. Add another action.
2. Choose **Display** -> **Set Wallpaper**.
3. Image/file path: `/sdcard/Download/ramadan-wallpaper.png`
4. Choose **Lock Screen** (or Both).
5. Save.

### Step 4: Important phone settings

1. Allow Tasker permissions (storage/photos/wallpaper).
2. Disable battery optimization for Tasker.
3. Allow Tasker to run in background.

Now your wallpaper should refresh every day automatically.

## Method B: MacroDroid (Easier)

### Step 1: Create macro

1. Open **MacroDroid**.
2. Tap **Add Macro**.

### Step 2: Trigger

1. Select **Trigger** -> **Date/Time** -> **Daily**.
2. Pick your update time.

### Step 3: Actions

1. Add action: **HTTP Request** (GET)
   - URL: paste your wallpaper URL
   - Save file as: `/sdcard/Download/ramadan-wallpaper.png`
2. Add action: **Set Wallpaper**
   - Choose the saved image
   - Select lock screen if your phone allows it

### Step 4: Permissions

1. Give all requested permissions.
2. Disable battery optimization for MacroDroid.

## Can I Use The Same Link Forever?

Yes. In your app, that link is dynamic.

- Same URL
- New image data each day
- No need to regenerate daily

Only create a new link if you want a different location, timezone, or calculation method.

## If It Does Not Update

1. Open the wallpaper URL in browser and confirm image loads.
2. Check app permissions again.
3. Turn off battery optimization for automation app.
4. Confirm the saved file time is updating in `/Download`.
5. Some phones block lock-screen automation. If so, use **KLWP** fallback.

## KLWP Fallback (Only If Needed)

Use this only if your phone blocks automatic lock-screen wallpaper changes.

1. Install **KLWP**.
2. Keep Tasker/MacroDroid download step (same file path).
3. In KLWP, set background image source to `/sdcard/Download/ramadan-wallpaper.png`.
4. Apply KLWP live wallpaper.

## Quick 1-Minute Test

1. Set trigger to run in the next 2 minutes.
2. Run automation.
3. Confirm `ramadan-wallpaper.png` appears/updates in Download.
4. Lock your phone and check wallpaper changed.
5. Next day, it should update automatically with the same link.
