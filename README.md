# Vocal Smash

Get quick, visual, useful feedback on hitting your notes with Vocal Smash!

Vocal Smash is a nifty singing app for serious singers and vocalists!

Vocal Smash is based on scientific research in the book Peak. One of the premises in the book is that the closer you get to instant feedback, then the more feedback cycles you can do in a given time, and this causes all types and ages of people self-learn at a faster pace, just by observing if they did it right or not. People have the ability to self-learn on if they get fast enough feedback.

## Features:

**MVP:**

* Pinch to zoom in on your range.

* Hold to freeze, tap to unfreeze: Sometimes you just want to sing a short riff then see how you did.


**Post-MVP:**

* Game: Compete with others and yourself with your "Singing Score".  others can upload their accapella recordings and you can compete against others for the best singing score which is based on how well you match the singer.
* Gestures: Swipe away or towards the animation flow direction to slow down or speed up the visualization flow.


* Grid: A light grid to give feedback on what note is being targeted when it is farther away from the source number row.

* TBD: Possibly add a number row at the end for a sandwhich effect too

* Visual: Put real sharps or flats in the gap between the whole notes.

* Resolution: Don't really want to expose this feature. If requested a lot, then I will, but I think the elegance of this app is also going to be in the settings and the interaction too.

* Color scheme: Adjust color schemes. This is way in the future, if I do it.




I built the ultimate singing feedback tool for myself and think others will love it too. Check the video out!

My name is Elijah Lynn and I am an open source software engineer. I've been teaching myself how to sing and have been looking for a tool to give me pitch feedback quickly. I haven't found what I have been looking for and I came across the open source project [YouTube Musical Spectrum](https://github.com/mfcc64/youtube-musical-spectrum) by Muhammad Faiz based on the showcqt.js library, also created by Muhammad.

## Getting Started

### Prerequisites
- asdf version manager (recommended for managing Node.js versions)
- Node.js (v18 or higher recommended, latest is v23.7.0)
- OpenSSL (for generating SSL certificates)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vocal-smash.git
cd vocal-smash
```

2. Install Node.js using asdf:
```bash
# Install the Node.js plugin if you haven't already
asdf plugin add nodejs

# Install the latest stable version of Node.js
asdf install nodejs latest

# Set Node.js version for this project
asdf set nodejs latest
```

3. Install dependencies:
```bash
# Install project dependencies
npm install
```

4. Generate SSL certificates (required for external network access):
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/private.key -out certs/certificate.pem -days 365 -nodes
```

5. Start the development server:
```bash
# Start the secure HTTPS server (required for external network access)
npm start
```

The application will be available at:
- HTTPS: https://localhost:3000 (when using `npm start`)
- You can also access it from other devices on your local network using your computer's IP address (e.g., https://192.168.1.100:3000)

### Development Notes
- The secure HTTPS server is required to access the application from other devices on your local network
- The build process uses esbuild to bundle the application
- The application uses modern web components and ES modules
- When accessing from other devices, you'll need to accept the self-signed certificate warning in your browser

### Fish Shell Configuration
If you're using fish shell, add this to your `~/.config/fish/config.fish`:
```fish
## asdf support
if test -z $ASDF_DATA_DIR
    set _asdf_shims "$HOME/.asdf/shims"
else
    set _asdf_shims "$ASDF_DATA_DIR/shims"
end

if not contains $_asdf_shims $PATH
    set -gx --prepend PATH $_asdf_shims
end
set --erase _asdf_shims
```
