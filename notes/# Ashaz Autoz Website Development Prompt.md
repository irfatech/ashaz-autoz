# Ashaz Autoz Website Development Prompt

Build a modern, premium automotive company website for **Ashaz Autoz**, inspired by the clean, premium feel and user experience of KTP Automovel, but **do not copy its design**. Create a unique brand identity with a modern layout, better UX, improved accessibility, and faster performance. The website should communicate trust, professionalism, and premium automotive services in Timor-Leste. The site should showcase vehicles, services, company information, customer trust, and make it easy for visitors to contact us. Ashaz Autoz yard
Ponte Foun, Comoro, Dili, Timor-Leste
7715 4379 · 7524 9000 · 7379 7973
Mon–Sat, 8:00–17:30

## Technology Stack

* Astro 7
* TypeScript
* Tailwind CSS v4
* Astro Content Collections
* Sveltia CMS (Git-based)
* Markdown + YAML content
* Cloudflare Pages deployment
* GitHub repository
* Astro Image for optimized images
* MDX support
* No React
* Vue if necessary

## Development Goals
a
* Static-first architecture
* Partial hydration only where needed
* Lighthouse score above 95
* Excellent Core Web Vitals
* SEO-first
* Mobile-first responsive design
* Accessibility (WCAG AA)
* Dark and Light mode
* Fast page transitions
* Modern animations without hurting performance

## Website Structure

Home

About Us

Services

Vehicle Inventory

Rentals

Workshop

Gallery

Blog

Instagram Video Preview

Contact

Privacy Policy

Terms & Conditions

404 Page

## Homepage Sections

* Full-screen hero with premium automotive imagery/video
* Company introduction
* Featured vehicles
* Services overview
* Why choose Ashaz Autoz
* Vehicle categories
* Customer testimonials
* Recent blog articles
* Instagram/Facebook highlights
* Call-to-action section
* Google Map
* Contact information
* Footer

## Vehicle Inventory

Each vehicle should include:

* Images
* Brand
* Model
* Year
* Mileage
* Transmission
* Fuel Type
* Engine
* Drive Type
* Price
* Status (Available, Reserved, Sold)
* Features
* Gallery
* WhatsApp enquiry button

The inventory is for showcasing vehicles only. There is no online checkout.

## Services

* Vehicle Sales
* Vehicle Import
* Car Rental
* Workshop & Maintenance
* Diagnostics
* Fleet Services
* VIP Transport
* Spare Parts

## CMS Content

Manage all content using Sveltia CMS.

Editable collections:

* Pages
* Blog Posts
* Vehicles
* Services
* Testimonials
* Team Members
* FAQs
* Gallery
* Partners
* Site Settings
* Navigation
* Footer
* SEO Settings

All content should be stored in Git using Markdown or YAML.

## Design Style

Premium automotive brand.

Color palette:

* Charcoal
* Black
* White
* Metallic Gray
* Gold accent

Use:

* Large typography
* Generous whitespace
* Premium photography
* Rounded cards
* Glassmorphism only where appropriate
* Smooth hover animations
* Modern icons (Lucide)

## SEO

* Schema.org
* Open Graph
* Twitter Cards
* XML Sitemap
* robots.txt
* Canonical URLs
* Breadcrumbs
* Automatic metadata
* Optimized images
* Structured data for vehicles and organization

## Performance

* Lazy-loaded images
* Responsive images
* Minimal JavaScript
* Code splitting
* Static generation
* Font optimization
* Image optimization
* Cache headers
* Cloudflare optimized deployment

## Content Collections

content/

* blog/
* vehicles/
* services/
* team/
* testimonials/
* faq/
* gallery/
* pages/

Define strict Zod schemas for every collection.

## Components

Navbar

Footer

Hero

VehicleCard

VehicleGrid

ServiceCard

FeatureSection

Gallery

Testimonials

FAQ

BlogCard

CTA

Breadcrumb

SEO Component

Pagination

ContactForm

WhatsApp Floating Button

Theme Toggle

## Multi-language Ready

Structure the project so future support for:

* English
* Tetum
* Bahasa Indonesia

can be added without major refactoring.

## Code Quality

* Clean architecture
* Reusable components
* Type-safe
* Fully documented
* ESLint
* Prettier
* Conventional commits

## Future Compatibility

The website should remain independent from future business applications.

In the future, an AutoTL marketplace (Laravel + Laradashboard) will consume the same vehicle data via API or synchronization, so keep the content structure modular and reusable.
