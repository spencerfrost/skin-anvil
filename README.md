# Skin Anvil

## Description
Skin Anvil is a web application designed to allow users to merge various elements of different Minecraft skins into a single customized skin. This tool is perfect for Minecraft players who want to create a unique look by combining parts of existing skins.

## Features
- Upload multiple skin files.
- Select parts to merge from each skin.
- Download the merged skin as a single image file.
- User-friendly interface.

## Installation

### Prerequisites
- Node.js
- npm

### Setup
To set up the Skin Anvil application on your local machine, follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skin-anvil.git
   cd skin-anvil
   ```

2. **Install dependencies**
   This project is split into two parts: the client and the server. You need to install dependencies for both.
   ```bash
   npm run install-all
   ```

## Usage

### Development
To run both the client and the server in development mode with hot reloading, use:
```bash
npm run dev
```
This command will start the frontend development server on `http://localhost:3000` and the backend server on `http://localhost:3004`.

### Production
To run the application in production mode:

1. **Build the client application**
   Before running the server, make sure to build the client application.
   ```bash
   npm run build
   ```
2. **Start the production server**
   ```bash
   npm run start
   ```
Ensure that all environment variables are set correctly for production environments.

## API Endpoints

- GET `/api/fetch-skin/:name`: Proxies the external skin lookup by username or UUID.
- GET `/api/health`: Health check.

Skin merging, editing, and downloads happen entirely client-side — there are no server endpoints for them.

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author
- Spencer Frost
