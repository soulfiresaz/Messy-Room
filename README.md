# Messy Room

A picture-first web app that helps kids organize and clean their rooms. See [PLAN.md](PLAN.md) for the full plan.

## Try it

Open `index.html` in a web browser. Nothing to install.

To use it on a tablet or phone, put the folder on any simple web host and open the link. Everything is saved on that device.

## What's built so far

- **Who are you?** The app opens by showing everyone's sticker. Tap yours, ✏️ to change someone's sticker, or ➕ to add a new person. Any number of people.
- **Home screen:** round circles: Rooms, Stickers, Rewards, Clean, Things, Today
- **Rooms:** My Room, plus Bathroom, Living Room and Kitchen grayed out.
- **My Room map:** a map from above in three steps. 📐 Set the room's width and depth (drag the yellow handles or use ➖ ➕), 🚪 drag the door, windows, light switch and outlets onto the walls, and tap ➕ closet to build a closet (folding doors, curtain, sliding, one door or none), save it, then drag it onto its wall, then 🛏️ drag furniture in from the tray. Pieces dropped near a wall turn so their back is against it. The big yellow button turns the map to match what you see. Tap a piece to turn it 🔄, open it 👀 or take it off the map ↩️; tap the door to change its swing. 🧰 shows all furniture.
- **🧺 Tidy up** (Clean → Tidy up): tap what's on the floor (your things, socks, books, trash, recycling, dishes, dirty clothes), choose one thing or one kind at a time, then put each away. The spot it goes glows with a 📍 (dishes say "take to the kitchen"); drag the picture there or tap it. Finishing counts a cleanup toward Rewards.
- **🧽 Jobs** (Clean → Jobs): picture cards of cleaning jobs that come from what's in the room. You see your own jobs and the shared ones. Tap one to see where it is on the map, then ✔️. Finishing all of today's jobs counts a cleanup. With the parent PIN 🔒, turn jobs on or off, choose every day or every week, and pick who does each.
- **📋 Today:** everyone's progress for today, as pictures or words: each person's jobs, which are done (and who did shared ones), and tidy-ups today. Phones open on Words. With the parent PIN, ⚙️ Job settings is one tap away.
- **🧸 Things:** a circle on the home screen. ➕ makes a thing (a pink flowered dress, a teddy bear, or a photo of anything), says whose it is and 📍 where it lives.
- **Whose and what:** on any furniture page, 👤 Whose? makes the whole piece someone's. Open a drawer, cubby or pocket to give it to someone else, share it (tap more than one sticker), and pick 🧺 what goes there. Owner stickers and the pictures show on the furniture. Taking a space away from someone else needs the parent PIN.
- **Doors:** tap a door on the map and 👀 to see it from the front, give it a label (like Bathroom), and ➕ to hang a pocket organizer or hooks on it. Closets work the same way on the outside of their doors.
- **More colors:** ➕ after the color circles opens a big grid of color squares.
- **My Room furniture:** tap ➕ to pick a ready-made piece (beds, dressers, side tables, drawer containers, cubbies, bookshelves, wire shelves, wall shelves, seats, hampers, baskets, bags, boxes, hooks, a wall file sorter). Tap any drawer, cubby, cupboard, shelf or rod to open it. Drag baskets between cubbies, drag a new bin, sorter or paper drawers in from the row under the picture, or drop one on 🗑️ to take it out. In a closet, the big 🚪 button switches between the inside and the outside of its doors. Change colors, add an optional label, and use 🔧 to change the parts (columns, drawers, cubbies that are open or hold a bin, a paper sorter or a paper drawer box, cupboard shelves, closet sections with one rod, a low rod, two rods or shelves). Removing a part that already holds things needs the parent PIN.
- **Stickers:** one shared collection (person, alien or animal). Each person picks one, and a sticker someone is using is taken. Only parents can delete stickers or people. Tap your sticker in the corner of the home screen to switch person.
- **Rewards** (shared by everyone): reward circles with stars that fill up as cleanups are finished. A ready reward bounces, and tapping it plays a sound and confetti.
- **Backup and restore** (tap ⚙️ 🔒 on the home screen, parent PIN): copy a backup as text to paste into a note or email, or save it as a file when the app runs on its own website. Restore by pasting it back or choosing the file.
- **Parent PIN** (tap 🔒 on Rewards): add rewards with a photo or picture, set how many cleanups are needed, mark "Earned," give a reward again, or delete it.

## Files

- `icons/`: the app icon (browser tab and iPad Home Screen)
- `manifest.webmanifest`: the app's name and icon for Home Screens

- `index.html`: the page
- `css/styles.css`: look and layout
- `js/store.js`: saving on the device
- `js/stickers.js`: drawings for person, alien and animal stickers
- `js/itemart.js`: drawings of clothes, stuffed animals, bags and blankets that can take any color and pattern
- `js/items.js`: the pictures for what goes where
- `js/furniture.js`: ready-made furniture, its parts and drawings (front and from above)
- `js/roommap.js`: the room map from above
- `js/jobs.js`: cleaning jobs suggested from the room, and their tool pictures
- `js/effects.js`: sound and confetti
- `js/app.js`: screens and buttons
