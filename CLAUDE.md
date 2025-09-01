# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based game project built with Phaser 3, TypeScript, and Vite. The project is currently in early development stage with a basic Vite + TypeScript template structure that includes Phaser as a game framework dependency.

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compiler followed by Vite build)
- `npm run preview` - Preview the production build locally

## Project Structure

- **src/main.ts** - Entry point that sets up the basic HTML structure and initializes components
- **src/counter.ts** - Example component showing basic TypeScript functionality
- **index.html** - Main HTML template with module script loading
- **tsconfig.json** - TypeScript configuration with strict settings and modern ES2022 target

## Technical Stack

- **Phaser 3.90.0** - Game framework for 2D games
- **TypeScript 5.8.3** - Type-safe JavaScript with strict compiler options
- **Vite 7.1.2** - Fast build tool and dev server
- **ES2022** target with modern module resolution

## TypeScript Configuration

The project uses strict TypeScript settings including:
- Strict type checking enabled
- No unused locals/parameters allowed
- Bundler module resolution
- ES2022 target with DOM libraries

## Current State

The project currently contains Vite's default TypeScript template code and has not yet been converted to use Phaser for game development. The Phaser dependency is installed but not yet integrated into the main application code.