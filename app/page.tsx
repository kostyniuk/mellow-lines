import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { ArrowRight, Wand2, Video, Layers, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GitHubIcon, TwitterIcon } from "@/components/ui/icons";
import { ThemedLightRays } from "@/components/themed-light-rays";

export default function Page() {
  return (
    <div className="relative w-full min-h-screen flex flex-col bg-background">
      {/* Light Rays Background */}
      <ThemedLightRays />

      {/* Background gradient similar to Cursor */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-background to-background/95" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex flex-col max-w-7xl">
          {/* Hero Text - Centered */}
          <div className="text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto max-w-4xl">
            <div className="flex justify-center">
              <Badge
                variant="secondary"
                className="text-xs sm:text-sm px-3 py-2 rounded-full bg-muted/50 border border-border"
              >
                v1.0 Public Beta
              </Badge>
            </div>

            <h1 className="text-5xl font-pixel-grid sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.1] ">
              Transform Code <br />
              into <span className="text-primary">Motion</span>
            </h1>

            <p className="text-md sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Create stunning, cinematic code walkthroughs in seconds. The
              ultimate free and open source tool for developers, content
              creators and educators.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
              <Link href="/editor">
                <Button
                  size="sm"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-xl font-medium"
                >
                  Open Editor
                </Button>
              </Link>
              <Link
                href="https://github.com/kostyniuk/mellow-lines"
                target="_blank"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-xl font-medium border-border/60 hover:bg-muted/50 hover:text-neutral-800 dark:hover:text-white"
                >
                  Star on GitHub
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Video Demo - Center Bottom */}
          <div className="w-full max-w-3xl mx-auto mt-12 sm:mt-16 lg:mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              {/* Shiny border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 p-[1px]">
                <div className="absolute inset-[1px] rounded-xl bg-background" />
              </div>

              {/* Video container */}
              <div className="relative rounded-xl overflow-hidden bg-muted/20">
                <video
                  src="/demo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20 lg:mt-24 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
            <FeatureCard
              icon={<Wand2 className="w-5 h-5 text-primary" />}
              title="Magic Transitions"
              description="Automatically analyze and animate code diffs with smooth, cinematic movement."
            />
            <FeatureCard
              icon={<Video className="w-5 h-5 text-primary" />}
              title="High-Quality Export"
              description="Render blazing fast, high-quality MP4 & WebM videos ready for social media."
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5 text-primary" />}
              title="Rich Theming"
              description="Select from a vast library of syntax themes and languages to match your brand."
            />
            <FeatureCard
              icon={<Play className="w-5 h-5 text-primary" />}
              title="Real-Time Preview"
              description="See your animation come to life instantly with live preview and timeline scrubbing."
            />
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="relative z-10 flex-shrink-0 py-6 sm:py-8 flex items-center justify-center text-center text-muted-foreground text-sm border-t border-border/50">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          <p>© 2026 mellowlines. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/kostyniuk/mellow-lines"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-4 h-4" />
            </a>
            <a
              href="https://x.com/costiniuc00"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <TwitterIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-muted/30 border-border/50 hover:border-border transition-all duration-200 shadow-none hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="mb-2 p-2 bg-primary/10 rounded-md w-fit">{icon}</div>
        <CardTitle className="text-base sm:text-lg font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
