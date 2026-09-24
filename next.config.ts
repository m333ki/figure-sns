import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests coming through the Cloudflare quick
  // tunnel (used to test on a phone when it can't reach the PC directly over
  // LAN) -- each tunnel run gets a random *.trycloudflare.com subdomain, so
  // this wildcards the whole domain rather than pinning one run's hostname.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // The floating "N" dev-route indicator sits in a screen corner, which on
  // a full-width mobile bottom nav always lands on top of one of the tabs
  // (moving its corner just trades which tab it covers). Real compile/
  // runtime errors still show via the full-screen overlay without it.
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "ofgiudgykshseyegcktj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
