# Web Scraper Setup Guide

A modern web scraping application powered by Firecrawl API with Next.js and TypeScript.

## Features

- **Scrape**: Extract content from a single URL in markdown or HTML format
- **Map**: Discover all indexed URLs on a website
- **Extract**: Extract structured information from web pages using AI
- **Search**: Search the web and get relevant results with metadata

## Prerequisites

- Node.js 18+ installed
- A Firecrawl API key (get one from [firecrawl.dev](https://firecrawl.dev))

## Setup Instructions

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   FIRECRAWL_API_KEY=fc-YOUR-API-KEY
   ```
   
   Replace `fc-YOUR-API-KEY` with your actual Firecrawl API key.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Scrape Tab
1. Enter a URL you want to scrape
2. Select output format (Markdown or HTML)
3. Click "Scrape URL"
4. View the extracted content and metadata

### Map Tab
1. Enter a website URL
2. Set the maximum number of URLs to discover (1-100)
3. Click "Map Website"
4. View all discovered URLs with links to open them

### Extract Tab
1. Add one or more URLs to extract data from
2. (Optional) Provide an extraction prompt
3. Define a JSON schema for the data structure you want
4. Click "Extract Data"
5. View the structured data extracted from the pages

### Search Tab
1. Enter a search query
2. Set the maximum number of results (1-20)
3. Click "Search"
4. View search results with titles, descriptions, and URLs
5. Click "Scrape" on any result to extract its content
6. Click "Open" to visit the URL in a new tab

## Project Structure

```
web-scraper/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts    # Scrape API endpoint
│   │   ├── map/route.ts       # Map API endpoint
│   │   ├── extract/route.ts   # Extract API endpoint
│   │   └── search/route.ts    # Search API endpoint
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── logo.tsx               # Logo component
│   ├── sidebar.tsx            # Sidebar navigation
│   ├── scrape-tab.tsx         # Scrape feature tab
│   ├── map-tab.tsx            # Map feature tab
│   ├── extract-tab.tsx        # Extract feature tab
│   └── search-tab.tsx         # Search feature tab
└── lib/
    └── utils.ts               # Utility functions
```

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firecrawl** - Web scraping API
- **Lucide React** - Icons

## Troubleshooting

### API Key Issues
- Make sure your `.env.local` file is in the root directory
- Ensure the API key starts with `fc-`
- Restart the development server after adding the API key

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Clear the `.next` folder and rebuild: `rm -rf .next && npm run dev`

## License

This project is for demonstration purposes.
