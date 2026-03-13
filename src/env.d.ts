/// <reference types="astro/client" />

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
}

declare namespace App {
  interface Locals {
    user: User | null;
  }
}
