<?php
namespace App\Http\Controllers;
use App\Models\StudentPoint;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $leaderboard = DB::table('student_points')
            ->select('user_id', DB::raw('SUM(points) as total_points'), DB::raw('COUNT(*) as total_actions'))
            ->groupBy('user_id')
            ->orderByDesc('total_points')
            ->take(50)
            ->get();

        $userIds = $leaderboard->pluck('user_id');
        $users = User::whereIn('id', $userIds)->get(['id', 'name', 'avatar', 'department', 'year_of_study'])->keyBy('id');

        $leaderboard = $leaderboard->map(fn($row) => [
            'user' => $users[$row->user_id] ?? null,
            'total_points' => $row->total_points,
            'total_actions' => $row->total_actions,
        ])->filter(fn($row) => $row['user'] !== null)->values();

        $myRank = null;
        $myPoints = null;
        if ($user = $request->user()) {
            $myPoints = StudentPoint::where('user_id', $user->id)->sum('points');
            $myRank = DB::table('student_points')
                ->select('user_id', DB::raw('SUM(points) as total'))
                ->groupBy('user_id')
                ->havingRaw('SUM(points) > ?', [$myPoints])
                ->count() + 1;
        }

        return inertia('student/leaderboard', compact('leaderboard', 'myRank', 'myPoints'));
    }
}
