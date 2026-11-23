# Messy Room

A picture-first web app that helps kids organize and clean their rooms. See [PLAN.md](PLAN.md) for the full plan.

## Try it

Open `index.html` in a web browser. Nothing to install.

To use it on a tablet or phone, put the folder on any simple web host and open the link. Everything is saved on that device.

## What's built so far

- **Who are you?** The app opens by showing everyone's sticker. Tap yours, ✏️ to change someone's sticker, or ➕ to add a new person. Any number of people.
- **Home screen:** four round circles, in order: Rooms, Stickers, Rewards, Clean (grayed out, coming soon)
- **Rooms:** My Room, plus Bathroom, Living Room and Kitchen grayed out.
- **My Room furniture:** tap ➕ to pick a ready-made piece (beds, dressers, side tables, drawer containers, cubbies, shelves, a closet, seats). Tap any drawer, cubby, cupboard, shelf or rod to open it. Change colors, add an optional label, and use 🔧 to change the parts (columns, drawers, cubbies with bins or paper sorters, cupboard shelves, closet rods). Removing a part that already holds things needs the parent PIN. The map from above is next.
- **Stickers:** one shared collection (person, alien or animal). Each person picks one, and a sticker someone is using is taken. Only parents can delete stickers or people. Tap your sticker in the corner of the home screen to switch person.
- **Rewards** (shared by everyone): reward circles with stars that fill up as cleanups are finished. A ready reward bounces, and tapping it plays a sound and confetti.
- **Parent PIN** (tap 🔒 on Rewards): add rewards with a photo or picture, set how many cleanups are needed, mark "Earned," give a reward again, or delete it.

## Files

- `index.html`: the page
- `css/styles.css`: look and layout
- `js/store.js`: saving on the device
- `js/stickers.js`: drawings for person, alien and animal stickers
- `js/furniture.js`: ready-made furniture, its parts and drawings
- `js/effects.js`: sound and confetti
- `js/app.js`: screens and buttons
