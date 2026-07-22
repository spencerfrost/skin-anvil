# Skin Anvil - Frontend

This is the frontend application for the Skin Anvil project. It allows users to upload and merge Minecraft skins, providing both 2D and 3D previews of the results.

## Features

- Upload multiple Minecraft skins
- Select specific parts from different skins to merge
- Preview uploaded skins and merged results in both 2D and 3D
- Responsive design for desktop and mobile use

## Technologies Used

- React
- Vite (build tooling) + Vitest (tests)
- skinview3d (for 3D skin rendering)
- Tailwind CSS (for styling)

## Getting Started

### Prerequisites

- Node.js (v22.12 or later)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your_username/skin-anvil-frontend.git
   cd skin-anvil-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. (Optional) Create a `.env` file in the root directory to override the backend origin (defaults to `http://localhost:3004` in dev):
   ```
   VITE_SERVER_ORIGIN=http://localhost:3004
   ```

### Running the Application

To start the development server:

```
npm start
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build:

```
npm run build
```

The built files will be in the `build` directory.

## Available Scripts

- `npm run dev` (or `npm start`): Runs the app in development mode
- `npm test`: Runs the test suite once (`npm run test:watch` for watch mode)
- `npm run build`: Builds the app for production
- `npm run preview`: Serves the production build locally
- `npm run lint`: Lints the source

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
