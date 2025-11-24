# SkinTrack

A web application to track your skincare routine and see how effective products are on your skin. Upload before photos, add products, get AI-powered analysis on product effectiveness and timelines, and track your progress over time.

## Features

- **User Authentication**: Secure email/password authentication
- **Photo Management**: Upload and store before/after photos using Cloudinary
- **Product Tracking**: Add and manage skincare products in your routine
- **AI Analysis**: Get AI-powered insights on:
  - Expected timeline for results from each product
  - Product interactions (conflicts and synergies)
  - Personalized recommendations
- **Progress Tracking**: Visual timeline and before/after photo comparisons
- **Dashboard**: Overview of your current routine and recent photos

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI API (GPT-4)
- **Storage**: Cloudinary for image storage
- **Auth**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- Cloudinary account (for image storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SkinTrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY`: Your OpenAI API key
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api              # API routes
  /(auth)          # Authentication pages
  /routine         # Routine management page
  /progress        # Progress tracking page
/components        # React components
/lib               # Utility functions and services
/prisma            # Database schema and migrations
```

## Usage

1. **Sign Up**: Create an account with your email and password
2. **Create Routine**: Add products to your skincare routine
3. **Upload Before Photo**: Upload a "before" photo to track your starting point
4. **Get AI Analysis**: Click "Analyze Routine with AI" to get insights on your products
5. **Track Progress**: Upload "after" photos over time to see your progress
6. **Compare Photos**: Use the before/after comparison tool to see changes

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio to view database
- `npm run db:migrate` - Run database migrations

## License

ISC
