"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Palette,
  Type,
  Layers,
  Sun,
  Moon,
  Monitor,
  Copy,
  Check,
  Eye,
  Download,
  Settings,
  Zap,
  Grid,
  Circle,
  Square,
} from "lucide-react";

// Design tokens
const colorTokens = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  secondary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
};

const typographyTokens = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    serif: ["Georgia", "serif"],
    mono: ["JetBrains Mono", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
  },
  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
};

const spacingTokens = {
  0: "0px",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
};

const shadowTokens = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  none: "0 0 #0000",
};

const borderRadiusTokens = {
  none: "0px",
  sm: "0.125rem",
  base: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");

  const copyToClipboard = async (text: string, tokenName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(tokenName);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const ColorPalette = ({
    colors,
    name,
  }: {
    colors: Record<string, string>;
    name: string;
  }) => (
    <div className="space-y-3">
      <h4 className="font-semibold capitalize">{name}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-11 gap-2">
        {Object.entries(colors).map(([shade, color]) => (
          <div key={shade} className="space-y-2">
            <div
              className="w-full h-16 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => copyToClipboard(color, `${name}-${shade}`)}
              title={`Click to copy ${color}`}
            />
            <div className="text-center">
              <div className="text-xs font-medium">{shade}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {color}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TokenCard = ({
    title,
    value,
    description,
    copyValue,
    preview,
  }: {
    title: string;
    value: string;
    description?: string;
    copyValue?: string;
    preview?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {preview}
        </div>
        <div className="text-sm text-muted-foreground font-mono">{value}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => copyToClipboard(copyValue || value, title)}
        className="ml-2"
      >
        {copiedToken === title ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Design System</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Our comprehensive design system provides the foundation for
          consistent, accessible, and beautiful user interfaces. Explore design
          tokens, components, and guidelines.
        </p>

        <div className="flex flex-wrap gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Design Tokens
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Square className="w-4 h-4" />
            Spacing
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Components
          </Badge>
        </div>
      </div>

      {/* Theme Toggle */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Theme Preview
          </CardTitle>
          <CardDescription>
            Switch between light and dark themes to see how design tokens adapt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedTheme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTheme("light")}
              className="flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Light
            </Button>
            <Button
              variant={selectedTheme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTheme("dark")}
              className="flex items-center gap-2"
            >
              <Moon className="w-4 h-4" />
              Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="colors" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing" className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Spacing
          </TabsTrigger>
          <TabsTrigger value="shadows" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Shadows
          </TabsTrigger>
          <TabsTrigger value="borders" className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Borders
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Our color system is built on semantic color tokens that adapt to
                different themes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {Object.entries(colorTokens).map(([name, colors]) => (
                <ColorPalette key={name} colors={colors} name={name} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-8">
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Typography System</CardTitle>
                <CardDescription>
                  Consistent typography scales and font families for all text
                  elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Font Families */}
                <div>
                  <h4 className="font-semibold mb-4">Font Families</h4>
                  <div className="space-y-2">
                    {Object.entries(typographyTokens.fontFamily).map(
                      ([name, fonts]) => (
                        <TokenCard
                          key={name}
                          title={name}
                          value={fonts.join(", ")}
                          description={`Font stack: ${fonts.join(" → ")}`}
                          copyValue={`font-${name}`}
                          preview={
                            <span
                              className="px-2 py-1 bg-muted rounded"
                              style={{ fontFamily: fonts.join(", ") }}
                            >
                              Sample Text
                            </span>
                          }
                        />
                      ),
                    )}
                  </div>
                </div>

                {/* Font Sizes */}
                <div>
                  <h4 className="font-semibold mb-4">Font Sizes</h4>
                  <div className="space-y-2">
                    {Object.entries(typographyTokens.fontSize).map(
                      ([name, value]) => {
                        const [size, config] = value as [
                          string,
                          { lineHeight: string },
                        ];
                        const { lineHeight } = config;
                        return (
                          <TokenCard
                            key={name}
                            title={name}
                            value={`${size} / ${lineHeight}`}
                            description={`Font size: ${size}, Line height: ${lineHeight}`}
                            copyValue={`text-${name}`}
                            preview={
                              <span
                                className="px-2 py-1 bg-muted rounded"
                                style={{ fontSize: size, lineHeight }}
                              >
                                Sample
                              </span>
                            }
                          />
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Font Weights */}
                <div>
                  <h4 className="font-semibold mb-4">Font Weights</h4>
                  <div className="space-y-2">
                    {Object.entries(typographyTokens.fontWeight).map(
                      ([name, weight]) => (
                        <TokenCard
                          key={name}
                          title={name}
                          value={weight}
                          description={`Font weight: ${weight}`}
                          copyValue={`font-${name}`}
                          preview={
                            <span
                              className="px-2 py-1 bg-muted rounded"
                              style={{ fontWeight: weight }}
                            >
                              Sample Text
                            </span>
                          }
                        />
                      ),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>
                Consistent spacing values for margins, padding, and layout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(spacingTokens).map(([name, value]) => (
                  <TokenCard
                    key={name}
                    title={name}
                    value={value}
                    description={`Spacing: ${value}`}
                    copyValue={`space-${name}`}
                    preview={
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary rounded"
                          style={{ width: value, height: "16px" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {value}
                        </span>
                      </div>
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shadows Tab */}
        <TabsContent value="shadows" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Shadow System</CardTitle>
              <CardDescription>
                Elevation and depth through consistent shadow tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(shadowTokens).map(([name, shadow]) => (
                  <TokenCard
                    key={name}
                    title={name}
                    value={shadow}
                    description={`Box shadow: ${shadow}`}
                    copyValue={`shadow-${name}`}
                    preview={
                      <div
                        className="w-12 h-8 bg-background border rounded"
                        style={{ boxShadow: shadow }}
                      />
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Borders Tab */}
        <TabsContent value="borders" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Border Radius</CardTitle>
              <CardDescription>
                Consistent border radius values for rounded corners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(borderRadiusTokens).map(([name, radius]) => (
                  <TokenCard
                    key={name}
                    title={name}
                    value={radius}
                    description={`Border radius: ${radius}`}
                    copyValue={`rounded-${name}`}
                    preview={
                      <div
                        className="w-12 h-8 bg-muted border"
                        style={{ borderRadius: radius }}
                      />
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Design Tokens
          </CardTitle>
          <CardDescription>
            Download design tokens in various formats for your development
            workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              CSS Variables
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Tailwind Config
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              JSON Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}