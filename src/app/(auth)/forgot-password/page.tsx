import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>Reset your password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-neutral-400">
          This feature is coming soon. Please contact support to reset your password.
        </p>
        <div className="pt-4 text-center text-sm">
          <Link href="/login" className="text-brand hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
