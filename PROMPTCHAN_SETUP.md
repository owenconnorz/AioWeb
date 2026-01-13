# PromptChan AI Integration Setup

This guide will help you set up PromptChan AI for image and video generation in your Naughty AI app.

## Getting Your API Key

1. **Create a PromptChan Account**
   - Visit [https://promptchan.com](https://promptchan.com)
   - Sign up for a new account or log in if you already have one

2. **Generate Your API Key**
   - Go to your account dashboard
   - Navigate to the **API Key** section
   - Click **"Generate"** to create a new API key
   - Copy the key and store it securely

## Adding the API Key to Your Project

### For Local Development

Create a `.env.local` file in your project root and add:

```env
PROMPTCHAN_API_KEY=your_api_key_here
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add a new variable:
   - Name: `PROMPTCHAN_API_KEY`
   - Value: Your PromptChan API key
   - Environment: Production, Preview, and Development
4. Click **Save**
5. Redeploy your application

## Features

PromptChan AI provides specialized NSFW content generation capabilities:

- **Image Generation**: High-quality AI image generation with NSFW support
- **Video Generation**: AI-powered video creation (requires API support)
- **NSFW Filter**: Works with your app's NSFW filter settings

## Usage

Once configured, select "PromptChan AI" from the model dropdown in:
- Image Generator tab
- Video Generator tab

The API will automatically use your configured key for generation.

## API Usage & Limits

- Check your PromptChan dashboard for current usage
- Purchase additional "gems" if you exceed the free quota
- Monitor your API key usage regularly

## Troubleshooting

**Error: "PromptChan API key not found"**
- Ensure your `.env.local` file exists and contains the API key
- For Vercel, verify the environment variable is set correctly
- Restart your development server after adding the key

**Error: "PromptChan API error"**
- Verify your API key is valid and not expired
- Check your PromptChan account for sufficient credits
- Review the browser console for detailed error messages

## Security Note

Never commit your `.env.local` file or expose your API key in client-side code. The API key should only be used in server-side routes.
