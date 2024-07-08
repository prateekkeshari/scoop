# Scoop - UTM Builder, QR Code Generator, and Link Preview Tool

Scoop is a free, all-in-one tool designed to simplify and enhance your digital marketing efforts. Built with Next.js, Scoop combines a UTM builder, QR code generator, and meta tag optimizer into one user-friendly platform.

## Features

- UTM Link Generator: Create trackable links with custom UTM parameters
- QR Code Generator: Generate customizable QR codes with optional logo embedding
- Meta Preview: Optimize and preview your meta tags for better SEO and social sharing
- Dark Mode Support: Toggle between light and dark themes for comfortable viewing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

- `app/page.tsx`: Main page component that renders the UTMGenerator
- `app/layout.tsx`: Root layout component with metadata and theme provider
- `components/UTMGenerator.tsx`: Core component with all the functionality

## Technologies Used

- Next.js 13+ with App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- next-themes for dark mode support
- QRCode.react for QR code generation
- Vercel Analytics for usage tracking

## Deployment

This project is optimized for deployment on Vercel. Simply connect your GitHub repository to Vercel for automatic deployments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
