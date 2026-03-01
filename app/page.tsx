import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Wand2, Play, Keyboard, Palette, Download, Settings, Paintbrush, Layers } from "lucide-react";
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

          {/* Use Cases - Bento Grid */}
          <div className="w-full max-w-5xl mx-auto mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
            {/* Context/Transition Use Case */}
            <Card className="relative overflow-hidden border-border/40 bg-muted/10 backdrop-blur-sm shadow-xl transition-all duration-300 group hover:border-border/80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  Code Transitions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed mt-2 text-muted-foreground">
                  Transform code blocks with fluid, cinematic animations. Perfect for visualizing refactors and diffs.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="border-t border-border/40 bg-muted/20 relative">
                  {/* Subtle inner shadow for depth feeling */}
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none z-20" />
                  <video
                    src="/demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto relative z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Typing Use Case */}
            <Card className="relative overflow-hidden border-border/40 bg-muted/10 backdrop-blur-sm shadow-xl transition-all duration-300 group hover:border-border/80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Keyboard className="w-5 h-5 text-primary" />
                  </div>
                  Typing Animations
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed mt-2 text-muted-foreground">
                  Bring static text to life with customizable typing effects. Control your flow and typing styles effortlessly.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="border-t border-border/40 bg-muted/20 relative">
                  {/* Subtle inner shadow for depth feeling */}
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none z-20" />
                  {/* Using demo.mp4 as placeholder until typing video is provided */}
                  <video
                    src="/typing-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto relative z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 sm:mt-20 lg:mt-24 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
            <FeatureCard
              icon={<Wand2 className="w-6 h-6" />}
              title="Smart Transitions"
              description="Automatically analyze code diffs and create smooth, cinematic movements between changes."
            />
            <FeatureCard
              icon={<Keyboard className="w-6 h-6" />}
              title="Realistic Typing"
              description="Simulate natural human keystrokes with customizable speed and flow for presentations."
            />
            <FeatureCard
              icon={<Palette className="w-6 h-6" />}
              title="Rich Theming"
              description="Select from a vast library of syntax themes, beautiful backgrounds, and modern fonts."
            />
            <FeatureCard
              icon={<Download className="w-6 h-6" />}
              title="High-Quality Export"
              description="Render blazing fast, crisp MP4 & WebM videos perfectly optimized for social media."
            />
            <FeatureCard
              icon={<Play className="w-6 h-6" />}
              title="Real-Time Preview"
              description="See your animation come to life instantly with live preview and interactive timeline scrubbing."
            />
            <FeatureCard
              icon={<Settings className="w-6 h-6" />}
              title="Fully Customizable"
              description="Tweak padding, drop shadows, window controls, and typography to fit your exact brand style."
            />
            <FeatureCard
              icon={<Paintbrush className="w-6 h-6" />}
              title="Background Theming"
              description="Pick from handcrafted gradient backgrounds, color accents, and patterns to frame your code beautifully."
            />
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="Multi-Step Scenes"
              description="Chain multiple code states into a sequence of scenes for complete, story-driven walkthroughs."
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
    <Card className="relative overflow-hidden border-border/40 bg-muted/10 backdrop-blur-sm shadow-md transition-all duration-300 group hover:border-border/80 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="pb-3 relative z-10">
        <div className="mb-3 p-2.5 bg-primary/10 text-primary rounded-lg w-fit">
          {icon}
        </div>
        <CardTitle className="text-base sm:text-lg font-bold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <CardDescription className="text-sm sm:text-base leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground/80">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
