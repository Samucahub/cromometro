import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  redirect(`${backendUrl}/auth/google`);
}
