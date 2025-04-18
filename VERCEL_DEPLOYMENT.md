# Deploying to Vercel

This project is configured for easy deployment to Vercel. Follow these steps to deploy:

## Prerequisites

1. A Vercel account (free at [vercel.com](https://vercel.com))
2. Vercel CLI (optional, for local deployment testing)

## Deployment Steps

### Option 1: Direct from GitHub

1. Push your project to a GitHub repository
2. Log in to your Vercel account
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the project type
6. Click "Deploy"

### Option 2: Using Vercel CLI

1. Install Vercel CLI globally:
   ```
   npm install -g vercel
   ```

2. Log in to your Vercel account:
   ```
   vercel login
   ```

3. Deploy from the project directory:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

## Configuration Details

- The `vercel.json` file configures the deployment
- The `build` script in package.json bundles the app and copies static assets
- The bundled files are placed in the `dist` directory

## Testing Your Deployment

After deployment, you can test your site at the URL provided by Vercel.

Note: Microphone access requires HTTPS, which Vercel provides automatically.
