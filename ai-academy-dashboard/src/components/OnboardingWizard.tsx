'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Rocket,
  User,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Trophy,
  Target,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { RoleType, TeamType, StreamType } from '@/lib/types';

const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE'];
const TEAMS: TeamType[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const STREAMS: StreamType[] = ['Tech', 'Business'];

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  'FDE': 'Forward Deployed Engineer',
  'AI-SE': 'AI Software Engineer',
  'AI-PM': 'AI Product Manager',
  'AI-DA': 'AI Data Analyst',
  'AI-DS': 'AI Data Scientist',
  'AI-SEC': 'AI Security Consultant',
  'AI-FE': 'AI Front-End Developer',
};

// Predefined avatar colors for selection
const AVATAR_COLORS = [
  { bg: '0062FF', name: 'Blue' },
  { bg: '10B981', name: 'Green' },
  { bg: 'F59E0B', name: 'Amber' },
  { bg: 'EF4444', name: 'Red' },
  { bg: '8B5CF6', name: 'Purple' },
  { bg: 'EC4899', name: 'Pink' },
  { bg: '06B6D4', name: 'Cyan' },
  { bg: '84CC16', name: 'Lime' },
];

type Step = 'welcome' | 'profile' | 'assignment' | 'complete';

const STEPS: Step[] = ['welcome', 'profile', 'assignment', 'complete'];

export function OnboardingWizard() {
  const { user, participant, isLoading: authLoading, refreshParticipant } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].bg);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    role: '',
    team: '',
    stream: '',
  });

  // Pre-fill from user metadata if available
  useEffect(() => {
    if (authLoading) return;

    if (participant) {
      // Already registered, go to dashboard
      router.push('/my-dashboard');
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    }
  }, [authLoading, user, participant, router]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  // Generate avatar URL based on nickname and selected color
  const getAvatarUrl = () => {
    const initials = formData.nickname
      ? formData.nickname.substring(0, 2).toUpperCase()
      : formData.name
        ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AI';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${selectedColor}&color=fff&size=200&bold=true`;
  };

  const handleSubmitProfile = async () => {
    if (!formData.name || !formData.nickname || !formData.role || !formData.team || !formData.stream) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate nickname format
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.nickname)) {
      toast.error('Nickname can only contain letters, numbers, underscores and hyphens');
      return;
    }

    if (formData.nickname.length < 2 || formData.nickname.length > 30) {
      toast.error('Nickname must be between 2 and 30 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email || user?.email,
          role: formData.role,
          team: formData.team,
          stream: formData.stream,
          avatar_url: getAvatarUrl(),
          auth_user_id: user?.id,
          // GitHub is optional - not included
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Registration failed');
      }

      toast.success('Profile created!');

      if (user) {
        await refreshParticipant();
      }

      goNext(); // Go to complete step
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const icons = {
              welcome: Rocket,
              profile: User,
              assignment: Users,
              complete: CheckCircle,
            };
            const Icon = icons[step];

            return (
              <div
                key={step}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-[#0062FF] border-[#0062FF] text-white'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-2">
        <CardContent className="pt-8 pb-8">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0062FF]/10 mb-4">
                <Rocket className="h-10 w-10 text-[#0062FF]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome to AI Academy!</h1>
                <p className="text-muted-foreground text-lg">
                  Get ready for an exciting journey into the world of AI and machine learning.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="h-8 w-8 mx-auto mb-2 text-[#0062FF]" />
                  <p className="font-medium">5 Weeks</p>
                  <p className="text-sm text-muted-foreground">Intensive training</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">Achievements</p>
                  <p className="text-sm text-muted-foreground">Collect badges</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Team Projects</p>
                  <p className="text-sm text-muted-foreground">Collaborate with others</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Let&apos;s set up your profile in just a few steps.
              </p>

              <Button
                size="lg"
                className="bg-[#0062FF] hover:bg-[#0052D9]"
                onClick={goNext}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Profile Step - Name, Nickname, Avatar */}
          {currentStep === 'profile' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0062FF]/10 mb-4">
                  <User className="h-8 w-8 text-[#0062FF]" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Create Your Profile</h2>
                <p className="text-muted-foreground">
                  Tell us about yourself so instructors and teammates can identify you.
                </p>
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your real name for the instructor to identify you
                  </p>
                </div>

                {/* Nickname */}
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname <span className="text-red-500">*</span></Label>
                  <Input
                    id="nickname"
                    placeholder="john_ai"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    required
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name for collaboration (letters, numbers, _ and - only)
                  </p>
                </div>

                {/* Avatar Color Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Choose Avatar Color
                  </Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border">
                      <AvatarImage src={getAvatarUrl()} alt="Avatar preview" />
                      <AvatarFallback>
                        {formData.nickname?.substring(0, 2).toUpperCase() || 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color.bg}
                          type="button"
                          onClick={() => setSelectedColor(color.bg)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            selectedColor === color.bg
                              ? 'ring-2 ring-offset-2 ring-[#0062FF] scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: `#${color.bg}` }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!formData.name || !formData.nickname}
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Assignment Step - Role/Team Selection */}
          {currentStep === 'assignment' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your Assignment</h2>
                <p className="text-muted-foreground">
                  Select your role and team for the academy.
                </p>
              </div>

              <div className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>Role <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role}</span>
                            <span className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Selection */}
                <div className="space-y-2">
                  <Label>Team <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.team}
                    onValueChange={(value) => setFormData({ ...formData, team: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your team" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          Team {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stream Selection */}
                <div className="space-y-2">
                  <Label>Stream <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.stream}
                    onValueChange={(value) => setFormData({ ...formData, stream: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAMS.map((stream) => (
                        <SelectItem key={stream} value={stream}>
                          {stream}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmitProfile}
                  disabled={isSubmitting || !formData.role || !formData.team || !formData.stream}
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                <Sparkles className="h-10 w-10 text-green-500" />
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">You&apos;re All Set!</h1>
                <p className="text-muted-foreground text-lg">
                  Welcome to AI Academy, {formData.nickname}!
                </p>
              </div>

              <div className="flex justify-center">
                <Avatar className="h-24 w-24 border-4 border-green-500">
                  <AvatarImage src={getAvatarUrl()} alt={formData.nickname} />
                  <AvatarFallback>{formData.nickname?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>

              <div className="bg-gradient-to-r from-[#0062FF]/10 to-purple-500/10 rounded-lg p-6">
                <h3 className="font-semibold mb-3">What&apos;s Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Explore your dashboard and track your progress
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Start with Day 1 learning materials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    Optionally connect GitHub later from your profile
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/my-dashboard">
                  <Button size="lg" className="bg-[#0062FF] hover:bg-[#0052D9]">
                    <Rocket className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/mission">
                  <Button size="lg" variant="outline">
                    <Target className="mr-2 h-5 w-5" />
                    Start Learning
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
