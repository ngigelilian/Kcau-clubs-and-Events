<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
    /**
     * Allowed email domains for Google OAuth login.
     */
    private const ALLOWED_DOMAINS = [
        'students.kcau.ac.ke',
        'kcau.ac.ke',
        'leaders.kcau.ac.ke',
    ];

    /**
     * Redirect the user to Google's OAuth page.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google OAuth.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Unable to authenticate with Google. Please try again.');
        }

        // Validate email domain: allow any subdomain of kcau.ac.ke for flexibility
        $emailDomain = Str::lower(Str::after($googleUser->getEmail(), '@'));

        if (! Str::endsWith($emailDomain, 'kcau.ac.ke')) {
            return redirect()->route('login')
                ->with('error', 'Only KCAU email addresses (kcau.ac.ke subdomains) are allowed.');
        }

        // Find or create user
        $user = User::withTrashed()->where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            // Update existing user's Google info
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ]);

            // Restore if soft-deleted
            if ($user->trashed()) {
                $user->restore();
            }

            // Check if user is active
            if (! $user->is_active) {
                return redirect()->route('login')
                    ->with('error', 'Your account has been deactivated. Please contact support.');
            }
        } else {
            // Create a new user
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            // Trigger the Registered event so domain-based role assignment runs
            event(new \Illuminate\Auth\Events\Registered($user));

            activity()
                ->causedBy($user)
                ->log('New student registered via Google OAuth');
        }

        Auth::login($user, remember: true);

        activity()
            ->causedBy($user)
            ->log('User logged in via Google OAuth');

        return redirect()->intended(route('dashboard'));
    }
}
