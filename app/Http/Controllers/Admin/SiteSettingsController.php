<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\Event;
use Illuminate\Http\Request;

class SiteSettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->keyBy('key');
        $upcomingEvents = Event::upcoming()->orderBy('start_datetime')->get(['id', 'title', 'slug']);

        return inertia('admin/site-settings/index', [
            'settings' => $settings,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $item) {
            SiteSetting::set($item['key'], $item['value'] ?? '');
        }

        return back()->with('success', 'Settings saved successfully!');
    }

    public function seed()
    {
        // Default settings — run once
        $defaults = [
            ['key' => 'hero_headline', 'value' => 'Your University Life, Elevated.', 'type' => 'text', 'group' => 'homepage', 'label' => 'Hero Headline'],
            ['key' => 'hero_subtitle', 'value' => 'Discover clubs, register for events, and connect with KCA University students', 'type' => 'text', 'group' => 'homepage', 'label' => 'Hero Subtitle'],
            ['key' => 'hero_cta_primary', 'value' => 'Explore Events', 'type' => 'text', 'group' => 'homepage', 'label' => 'Primary CTA Text'],
            ['key' => 'hero_cta_secondary', 'value' => 'Browse Clubs', 'type' => 'text', 'group' => 'homepage', 'label' => 'Secondary CTA Text'],
            ['key' => 'site_announcement', 'value' => '', 'type' => 'text', 'group' => 'general', 'label' => 'Site-wide Announcement Banner'],
            ['key' => 'announcement_color', 'value' => '#d0b216', 'type' => 'color', 'group' => 'general', 'label' => 'Announcement Banner Color'],
            ['key' => 'show_featured_events', 'value' => '1', 'type' => 'boolean', 'group' => 'homepage', 'label' => 'Show Featured Events Section'],
            ['key' => 'show_clubs_section', 'value' => '1', 'type' => 'boolean', 'group' => 'homepage', 'label' => 'Show Clubs Section'],
            ['key' => 'show_leaderboard', 'value' => '1', 'type' => 'boolean', 'group' => 'homepage', 'label' => 'Show Leaderboard on Homepage'],
            ['key' => 'ai_greeting', 'value' => 'Hello! I\'m the KCAU Events Assistant. How can I help you today?', 'type' => 'text', 'group' => 'ai', 'label' => 'AI Greeting Message'],
            ['key' => 'ai_enabled', 'value' => '1', 'type' => 'boolean', 'group' => 'ai', 'label' => 'Enable AI Chat Widget'],
            ['key' => 'points_register', 'value' => '10', 'type' => 'text', 'group' => 'gamification', 'label' => 'Points for Registering for an Event'],
            ['key' => 'points_attend', 'value' => '25', 'type' => 'text', 'group' => 'gamification', 'label' => 'Points for Attending an Event'],
            ['key' => 'points_join_club', 'value' => '15', 'type' => 'text', 'group' => 'gamification', 'label' => 'Points for Joining a Club'],
            ['key' => 'points_feedback', 'value' => '5', 'type' => 'text', 'group' => 'gamification', 'label' => 'Points for Submitting Feedback'],
            ['key' => 'footer_text', 'value' => '© 2026 KCA University. All rights reserved.', 'type' => 'text', 'group' => 'general', 'label' => 'Footer Text'],
            ['key' => 'contact_email', 'value' => 'studentaffairs@kcau.ac.ke', 'type' => 'text', 'group' => 'general', 'label' => 'Contact Email'],
            ['key' => 'contact_phone', 'value' => '+254 20 666 0000', 'type' => 'text', 'group' => 'general', 'label' => 'Contact Phone'],
        ];

        foreach ($defaults as $d) {
            SiteSetting::firstOrCreate(['key' => $d['key']], $d);
        }

        return back()->with('success', 'Default settings seeded!');
    }
}
