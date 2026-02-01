'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Github,
  User,
  Mail,
  Users,
  Briefcase,
  Link as LinkIcon,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, participant, isLoading, refreshParticipant } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);

  const handleConnectGitHub = async () => {
    setIsConnecting(true);
    const supabase = getSupabaseClient();

    // Link GitHub account to existing user
    const { error } = await supabase.auth.linkIdentity({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        scopes: 'read:user user:email',
      },
    });

    if (error) {
      toast.error(error.message);
      setIsConnecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/github`
    : 'https://your-app.vercel.app/api/webhook/github';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please complete your profile first.{' '}
            <Link href="/onboarding" className="text-[#0062FF] hover:underline">
              Go to onboarding
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={participant.avatar_url || undefined} alt={participant.nickname} />
                <AvatarFallback className="text-xl">
                  {participant.nickname?.substring(0, 2).toUpperCase() || 'AI'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{participant.name}</h3>
                <p className="text-muted-foreground">@{participant.nickname}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{participant.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{participant.role}</span>
                <Badge variant="outline">{participant.stream}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Team {participant.team}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Connection
            </CardTitle>
            <CardDescription>
              Connect your GitHub account to submit assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participant.github_username ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      GitHub Connected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{participant.github_username}
                    </p>
                  </div>
                </div>

                {participant.repo_url && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={participant.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0062FF] hover:underline flex items-center gap-1"
                    >
                      View Repository
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowWebhookSetup(!showWebhookSetup)}
                >
                  <Webhook className="mr-2 h-4 w-4" />
                  {showWebhookSetup ? 'Hide' : 'Show'} Webhook Setup
                </Button>

                {showWebhookSetup && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <p className="font-medium">Set up webhook for automatic submissions:</p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Go to your repository Settings → Webhooks</li>
                      <li>Click "Add webhook"</li>
                      <li>
                        Payload URL:
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background px-2 py-1 rounded text-xs truncate">
                            {webhookUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(webhookUrl)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                      <li>Content type: application/json</li>
                      <li>Select "Just the push event"</li>
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Github className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your GitHub account to submit code assignments and track your progress.
                  </p>
                  <Button
                    onClick={handleConnectGitHub}
                    disabled={isConnecting}
                    className="bg-[#24292e] hover:bg-[#1b1f23] text-white"
                  >
                    {isConnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Github className="mr-2 h-4 w-4" />
                    )}
                    Connect GitHub
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Optional - You can still access all learning materials without GitHub.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about assignments and announcements
              </p>
            </div>
            <Badge variant={participant.email_notifications ? 'default' : 'secondary'}>
              {participant.email_notifications ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">
                Your current account status
              </p>
            </div>
            <Badge
              variant={participant.status === 'approved' ? 'default' : 'secondary'}
              className={participant.status === 'approved' ? 'bg-green-500' : ''}
            >
              {participant.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
