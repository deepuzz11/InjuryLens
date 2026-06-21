import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_analysis',    label: 'First Step',        desc: 'Complete your first analysis',              icon: '🎯', xp: 50,  condition: (h) => h.length >= 1  },
  { id: 'ten_analyses',      label: 'Dedicated Athlete', desc: 'Complete 10 analyses',                      icon: '🏅', xp: 200, condition: (h) => h.length >= 10 },
  { id: 'twenty_analyses',   label: 'Consistency King',  desc: 'Complete 20 analyses',                      icon: '💪', xp: 400, condition: (h) => h.length >= 20 },
  { id: 'low_risk',          label: 'Clean Form',        desc: 'Score below 20% overall risk',              icon: '✅', xp: 150, condition: (h) => h.some((e) => (e.scores?.overall ?? 100) < 20) },
  { id: 'streak_3',          label: '3-Day Streak',      desc: 'Analyze 3 days in a row',                   icon: '🔥', xp: 100, condition: (_, streak) => streak >= 3  },
  { id: 'streak_7',          label: 'Week Warrior',      desc: 'Analyze 7 days in a row',                   icon: '⚡', xp: 300, condition: (_, streak) => streak >= 7  },
  { id: 'streak_14',         label: 'Iron Discipline',   desc: 'Analyze 14 days in a row',                  icon: '🛡️', xp: 600, condition: (_, streak) => streak >= 14 },
  { id: 'improvement_10',    label: 'Getting Better',    desc: 'Improve risk score by 10+ points',          icon: '📈', xp: 200, condition: (h) => h.length >= 2 && (h[1]?.scores?.overall ?? 0) - (h[0]?.scores?.overall ?? 0) >= 10 },
  { id: 'improvement_30',    label: 'Transformation',    desc: 'Improve risk score by 30+ points',          icon: '🏆', xp: 500, condition: (h) => h.length >= 2 && (h[h.length-1]?.scores?.overall ?? 0) - (h[0]?.scores?.overall ?? 0) >= 30 },
  { id: 'five_movements',    label: 'Well Rounded',      desc: 'Analyze 5 different movement types',        icon: '🤸', xp: 250, condition: (h) => new Set(h.map((e) => e.movement_type)).size >= 5 },
  { id: 'all_movements',     label: 'Movement Master',   desc: 'Analyze all 12 movement types',             icon: '🌟', xp: 800, condition: (h) => new Set(h.map((e) => e.movement_type)).size >= 12 },
  { id: 'perfect_squat',     label: 'Squat King',        desc: 'Score A-grade MQS on a squat',              icon: '👑', xp: 300, condition: (h) => h.some((e) => e.movement_type === 'Squat' && e.supplementary?.mqs_grade === 'A') },
  { id: 'five_goals',        label: 'Goal Setter',       desc: 'Create 5 training goals',                   icon: '🎯', xp: 150, condition: (h, _s, goals) => (goals?.length ?? 0) >= 5 },
  { id: 'goal_achieved',     label: 'Goal Crusher',      desc: 'Achieve your first training goal',          icon: '✨', xp: 300, condition: (h, _s, goals) => (goals ?? []).some((g) => g.achieved) },
  { id: 'recovery_7',        label: 'Recovery Pro',      desc: 'Log recovery data for 7 days',              icon: '😴', xp: 200, condition: (h, _s, _g, recovLogs) => (recovLogs?.length ?? 0) >= 7 },
]

function computeAchievements(history, streak, goals = [], recoveryLogs = []) {
  return ACHIEVEMENTS.filter((a) => a.condition(history, streak, goals, recoveryLogs)).map((a) => a.id)
}

function computeStreak(history) {
  if (!history.length) return 0
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date)
    const curr = new Date(sorted[i].date)
    const diffDays = Math.floor((prev - curr) / 86400000)
    if (diffDays <= 1) streak++
    else break
  }
  return streak
}

function computeReadiness(sleep, soreness, energy) {
  const sleepScore   = Math.min(sleep / 9, 1) * 40
  const sorenessScore = ((5 - soreness) / 4) * 30
  const energyScore  = (energy / 5) * 30
  return Math.round(sleepScore + sorenessScore + energyScore)
}

// ─── Default profile ──────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  id:           'default',
  name:         'Default Athlete',
  fitnessLevel: 'Intermediate',
  ageGroup:     '25–34',
  goal:         'Injury Prevention',
  sport:        '',
  createdAt:    new Date().toISOString(),
}

const AUTH_API = '/auth'

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth ─────────────────────────────────────────────────────────────────
      isAuthenticated: false,
      authUser: null,
      authToken: null,

      login: (user, token) => set({ isAuthenticated: true, authUser: user, authToken: token }),

      logout: () => set({
        isAuthenticated: false, authUser: null, authToken: null,
        screen: 'upload', results: null, error: null,
      }),

      loginAsDemo: () => {
        const d = (n) => new Date(Date.now() - n * 86400000).toISOString()
        const uid = (p, n) => `demo-${p}-${n}`
        const todayStr = new Date().toDateString()
        const dayStr   = (n) => new Date(Date.now() - n * 86400000).toDateString()

        const history = [
          // Day 0 — Squat, best score, MQS grade A
          { id: uid('h',0),  date: d(0),  movement_type:'Squat',        scores:{overall:18, knee_valgus_left:14, knee_valgus_right:12, trunk_lean:16, asymmetry:8,  shoulder:10}, supplementary:{avg_left_knee_angle:88, avg_right_knee_angle:89, avg_trunk_lean_angle:8,  total_frames_analyzed:182, rep_count:8,  fatigue_score:12, mqs_score:88, mqs_grade:'A', injury_probability_4w:0.06}, ai_coaching:{overall_risk_level:'low',      overall_summary:'Excellent squat form — very low risk profile.',          priority_issue:'Minor right shoulder tension detected.'}, annotated_frame:null, profileId:'default' },
          // Day 1 — Deadlift
          { id: uid('h',1),  date: d(1),  movement_type:'Deadlift',     scores:{overall:30, knee_valgus_left:10, knee_valgus_right:9,  trunk_lean:28, asymmetry:14, shoulder:12}, supplementary:{avg_left_knee_angle:92, avg_right_knee_angle:93, avg_trunk_lean_angle:22, total_frames_analyzed:160, rep_count:6,  fatigue_score:18, mqs_score:76, mqs_grade:'B', injury_probability_4w:0.12}, ai_coaching:{overall_risk_level:'low',      overall_summary:'Good deadlift mechanics, slight trunk lean to address.',  priority_issue:'Trunk lean increasing at heavier loads.'}, annotated_frame:null, profileId:'default' },
          // Day 2 — Lunge
          { id: uid('h',2),  date: d(2),  movement_type:'Lunge',        scores:{overall:34, knee_valgus_left:24, knee_valgus_right:20, trunk_lean:28, asymmetry:18, shoulder:14}, supplementary:{avg_left_knee_angle:90, avg_right_knee_angle:91, avg_trunk_lean_angle:20, total_frames_analyzed:144, rep_count:10, fatigue_score:20, mqs_score:72, mqs_grade:'C', injury_probability_4w:0.14}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Moderate risk on lunges due to knee valgus.',              priority_issue:'Left knee collapses inward on the descent.'}, annotated_frame:null, profileId:'default' },
          // Day 3 — Jump Landing
          { id: uid('h',3),  date: d(3),  movement_type:'Jump Landing',  scores:{overall:38, knee_valgus_left:30, knee_valgus_right:26, trunk_lean:32, asymmetry:22, shoulder:16}, supplementary:{avg_left_knee_angle:86, avg_right_knee_angle:87, avg_trunk_lean_angle:24, total_frames_analyzed:98,  rep_count:12, fatigue_score:24, mqs_score:68, mqs_grade:'C', injury_probability_4w:0.18}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Jump landing mechanics need attention — soft landing pattern.',  priority_issue:'Bilateral knee valgus on landing.'}, annotated_frame:null, profileId:'default' },
          // Day 4 — Squat
          { id: uid('h',4),  date: d(4),  movement_type:'Squat',        scores:{overall:40, knee_valgus_left:30, knee_valgus_right:26, trunk_lean:34, asymmetry:20, shoulder:18}, supplementary:{avg_left_knee_angle:87, avg_right_knee_angle:88, avg_trunk_lean_angle:26, total_frames_analyzed:178, rep_count:8,  fatigue_score:26, mqs_score:66, mqs_grade:'C', injury_probability_4w:0.20}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Squat showing improvement but knee tracking still inconsistent.',  priority_issue:'Hip abductors need strengthening to reduce knee valgus.'}, annotated_frame:null, profileId:'default' },
          // Day 5 — Running
          { id: uid('h',5),  date: d(5),  movement_type:'Running',      scores:{overall:42, knee_valgus_left:28, knee_valgus_right:24, trunk_lean:36, asymmetry:26, shoulder:20}, supplementary:{avg_left_knee_angle:85, avg_right_knee_angle:86, avg_trunk_lean_angle:28, total_frames_analyzed:240, rep_count:null,fatigue_score:30, mqs_score:64, mqs_grade:'C', injury_probability_4w:0.22}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Running gait has forward lean — increases lower back load.',  priority_issue:'Trunk lean at high speed exceeds safe threshold.'}, annotated_frame:null, profileId:'default' },
          // Day 6 — Deadlift
          { id: uid('h',6),  date: d(6),  movement_type:'Deadlift',     scores:{overall:46, knee_valgus_left:14, knee_valgus_right:12, trunk_lean:44, asymmetry:24, shoulder:22}, supplementary:{avg_left_knee_angle:91, avg_right_knee_angle:92, avg_trunk_lean_angle:36, total_frames_analyzed:155, rep_count:6,  fatigue_score:32, mqs_score:60, mqs_grade:'D', injury_probability_4w:0.24}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Deadlift trunk lean is the primary risk factor.',           priority_issue:'Excessive forward lean at lockout — brace harder.'}, annotated_frame:null, profileId:'default' },
          // Day 9 — Lunge
          { id: uid('h',7),  date: d(9),  movement_type:'Lunge',        scores:{overall:48, knee_valgus_left:36, knee_valgus_right:30, trunk_lean:40, asymmetry:28, shoulder:24}, supplementary:{avg_left_knee_angle:89, avg_right_knee_angle:90, avg_trunk_lean_angle:32, total_frames_analyzed:142, rep_count:10, fatigue_score:34, mqs_score:58, mqs_grade:'D', injury_probability_4w:0.26}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Lunge quality inconsistent — right side compensation pattern.', priority_issue:'Right hip dropping on left-leg lunges.'}, annotated_frame:null, profileId:'default' },
          // Day 12 — Push-up
          { id: uid('h',8),  date: d(12), movement_type:'Push-up',      scores:{overall:42, knee_valgus_left:8,  knee_valgus_right:7,  trunk_lean:48, asymmetry:22, shoulder:44}, supplementary:{avg_left_knee_angle:null,avg_right_knee_angle:null, avg_trunk_lean_angle:40, total_frames_analyzed:132, rep_count:15, fatigue_score:28, mqs_score:62, mqs_grade:'D', injury_probability_4w:0.22}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Push-up form is OK but shoulder asymmetry needs work.',      priority_issue:'Right shoulder drops below left — rotator cuff imbalance.'}, annotated_frame:null, profileId:'default' },
          // Day 14 — Squat
          { id: uid('h',9),  date: d(14), movement_type:'Squat',        scores:{overall:52, knee_valgus_left:42, knee_valgus_right:36, trunk_lean:44, asymmetry:30, shoulder:26}, supplementary:{avg_left_knee_angle:86, avg_right_knee_angle:87, avg_trunk_lean_angle:36, total_frames_analyzed:174, rep_count:8,  fatigue_score:36, mqs_score:54, mqs_grade:'D', injury_probability_4w:0.30}, ai_coaching:{overall_risk_level:'high',     overall_summary:'High risk session — significant knee valgus under load.',  priority_issue:'Load too heavy for current valgus control — reduce weight.'}, annotated_frame:null, profileId:'default' },
          // Day 16 — Jump Landing
          { id: uid('h',10), date: d(16), movement_type:'Jump Landing',  scores:{overall:56, knee_valgus_left:46, knee_valgus_right:40, trunk_lean:48, asymmetry:34, shoulder:28}, supplementary:{avg_left_knee_angle:84, avg_right_knee_angle:85, avg_trunk_lean_angle:40, total_frames_analyzed:96,  rep_count:12, fatigue_score:40, mqs_score:50, mqs_grade:'D', injury_probability_4w:0.34}, ai_coaching:{overall_risk_level:'high',     overall_summary:'High-risk landing pattern — ACL stress indicators.',       priority_issue:'Both knees collapse on every landing — critical issue.'}, annotated_frame:null, profileId:'default' },
          // Day 18 — Deadlift
          { id: uid('h',11), date: d(18), movement_type:'Deadlift',     scores:{overall:54, knee_valgus_left:16, knee_valgus_right:14, trunk_lean:58, asymmetry:28, shoulder:26}, supplementary:{avg_left_knee_angle:90, avg_right_knee_angle:91, avg_trunk_lean_angle:50, total_frames_analyzed:148, rep_count:5,  fatigue_score:38, mqs_score:52, mqs_grade:'D', injury_probability_4w:0.32}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Deadlift showing high trunk lean — lower back at risk.',    priority_issue:'Hinging with rounded lower back — injury risk elevated.'}, annotated_frame:null, profileId:'default' },
          // Day 21 — Squat
          { id: uid('h',12), date: d(21), movement_type:'Squat',        scores:{overall:58, knee_valgus_left:48, knee_valgus_right:42, trunk_lean:50, asymmetry:36, shoulder:28}, supplementary:{avg_left_knee_angle:85, avg_right_knee_angle:86, avg_trunk_lean_angle:42, total_frames_analyzed:168, rep_count:8,  fatigue_score:40, mqs_score:48, mqs_grade:'D', injury_probability_4w:0.36}, ai_coaching:{overall_risk_level:'high',     overall_summary:'Squat mechanics need immediate attention.',               priority_issue:'Severe valgus at depth — reduce load and fix cues.'}, annotated_frame:null, profileId:'default' },
          // Day 23 — Running
          { id: uid('h',13), date: d(23), movement_type:'Running',      scores:{overall:56, knee_valgus_left:38, knee_valgus_right:34, trunk_lean:54, asymmetry:30, shoulder:24}, supplementary:{avg_left_knee_angle:83, avg_right_knee_angle:84, avg_trunk_lean_angle:46, total_frames_analyzed:230, rep_count:null,fatigue_score:38, mqs_score:50, mqs_grade:'D', injury_probability_4w:0.34}, ai_coaching:{overall_risk_level:'moderate', overall_summary:'Running biomechanics show fatigue-induced collapse.',      priority_issue:'Cadence too low — trunk stability deteriorates at pace.'}, annotated_frame:null, profileId:'default' },
          // Day 25 — Lunge
          { id: uid('h',14), date: d(25), movement_type:'Lunge',        scores:{overall:62, knee_valgus_left:52, knee_valgus_right:46, trunk_lean:56, asymmetry:42, shoulder:30}, supplementary:{avg_left_knee_angle:88, avg_right_knee_angle:89, avg_trunk_lean_angle:48, total_frames_analyzed:138, rep_count:10, fatigue_score:42, mqs_score:44, mqs_grade:'D', injury_probability_4w:0.40}, ai_coaching:{overall_risk_level:'high',     overall_summary:'Lunge showing high bilateral asymmetry and valgus.',      priority_issue:'Single-leg stability is the limiting factor.'}, annotated_frame:null, profileId:'default' },
          // Day 28 — Deadlift
          { id: uid('h',15), date: d(28), movement_type:'Deadlift',     scores:{overall:64, knee_valgus_left:18, knee_valgus_right:16, trunk_lean:66, asymmetry:32, shoulder:28}, supplementary:{avg_left_knee_angle:89, avg_right_knee_angle:90, avg_trunk_lean_angle:58, total_frames_analyzed:144, rep_count:5,  fatigue_score:44, mqs_score:42, mqs_grade:'D', injury_probability_4w:0.42}, ai_coaching:{overall_risk_level:'high',     overall_summary:'Deadlift form critically poor — very high trunk lean.',   priority_issue:'Disengage from heavy loading until spinal neutral is found.'}, annotated_frame:null, profileId:'default' },
          // Day 32 — Squat
          { id: uid('h',16), date: d(32), movement_type:'Squat',        scores:{overall:66, knee_valgus_left:56, knee_valgus_right:50, trunk_lean:60, asymmetry:40, shoulder:30}, supplementary:{avg_left_knee_angle:84, avg_right_knee_angle:85, avg_trunk_lean_angle:52, total_frames_analyzed:162, rep_count:8,  fatigue_score:48, mqs_score:40, mqs_grade:'D', injury_probability_4w:0.44}, ai_coaching:{overall_risk_level:'high',     overall_summary:'First squat analysis reveals significant issues to work on.',priority_issue:'Multiple risk factors — start with bodyweight form work.'}, annotated_frame:null, profileId:'default' },
          // Day 38 — Squat (first ever analysis)
          { id: uid('h',17), date: d(38), movement_type:'Squat',        scores:{overall:68, knee_valgus_left:58, knee_valgus_right:52, trunk_lean:62, asymmetry:44, shoulder:32}, supplementary:{avg_left_knee_angle:83, avg_right_knee_angle:84, avg_trunk_lean_angle:54, total_frames_analyzed:156, rep_count:8,  fatigue_score:50, mqs_score:38, mqs_grade:'D', injury_probability_4w:0.46}, ai_coaching:{overall_risk_level:'high',     overall_summary:'Welcome to InjuryLens! Several form issues detected.',     priority_issue:'Knee valgus is severe — focus on hip strengthening first.'}, annotated_frame:null, profileId:'default' },
        ]

        const recoveryLogs = Array.from({ length: 21 }, (_, i) => {
          const n = 20 - i
          const sleep = [7.5,6.5,8,7,8.5,6,7.5,9,7,8,6.5,7,8,7.5,6,9,7,8,6.5,7,8][i] ?? 7
          const soreness = [2,3,2,3,1,4,2,1,2,3,3,2,1,2,4,1,2,2,3,3,2][i] ?? 2
          const energy = [4,3,4,3,5,2,4,5,4,3,3,4,5,4,2,5,4,4,3,3,4][i] ?? 3
          const readiness = Math.round((Math.min(sleep/9,1)*40) + ((5-soreness)/4*30) + (energy/5*30))
          return { id: uid('r', n), date: d(n), sleep, soreness, energy, readiness }
        })

        const goals = [
          { id: uid('g',0), title: 'Eliminate Knee Valgus on Squat', movement_type: 'Squat',    metric: 'knee_valgus_left',  target: 20, notes: 'Left knee collapses at depth — need to fix hip abductor weakness.', created: d(38), achieved: true,  achievedDate: d(4) },
          { id: uid('g',1), title: 'Lower Overall Risk Below 25%',   movement_type: 'Squat',    metric: 'overall',           target: 25, notes: 'Get overall squat risk under 25% consistently.',                   created: d(30), achieved: false, achievedDate: null },
          { id: uid('g',2), title: 'Fix Deadlift Trunk Lean',        movement_type: 'Deadlift', metric: 'trunk_lean',        target: 20, notes: 'Too much forward lean — brace core harder and cue chest up.',     created: d(20), achieved: false, achievedDate: null },
        ]

        const journalEntries = [
          { id: uid('j',0), date: d(0),  type:'Strength',  duration:55, rpe:6, mood:5, notes:'Felt really strong today, squats clicked perfectly.',         wins:'Perfect depth with no valgus!',        improvements:'Work on breathing pattern', movements:'Squat, Goblet Squat, Step Down' },
          { id: uid('j',1), date: d(1),  type:'Strength',  duration:60, rpe:7, mood:4, notes:'Deadlift session, focused on spinal position.',               wins:'Kept back flat all sets',              improvements:'Need to brace earlier in the lift', movements:'Deadlift, RDL, Bird Dog' },
          { id: uid('j',2), date: d(2),  type:'Mobility',  duration:30, rpe:3, mood:4, notes:'Hip mobility and ankle work — felt great.',                   wins:'Hip flexors much less tight',          improvements:'', movements:'Hip 90-90, Ankle CARs, Cat-Cow' },
          { id: uid('j',3), date: d(3),  type:'Cardio',    duration:40, rpe:6, mood:3, notes:'Jump training — landing mechanics still need work.',           wins:'Soft landing on most reps',            improvements:'Still collapsing on fatigued reps', movements:'Box jumps, Broad jump, Landing practice' },
          { id: uid('j',4), date: d(4),  type:'Strength',  duration:65, rpe:7, mood:4, notes:'Squat day — new PB at bodyweight control.',                   wins:'8 reps with great form',               improvements:'', movements:'Squat, Clamshell, Lateral band walk' },
          { id: uid('j',5), date: d(5),  type:'Cardio',    duration:35, rpe:5, mood:4, notes:'Easy run — focused on upright posture.',                      wins:'Cadence hit 170 spm',                  improvements:'Trunk still dips at end of run', movements:'Running 4km' },
          { id: uid('j',6), date: d(7),  type:'Rehab',     duration:25, rpe:2, mood:3, notes:'Right knee rehab exercises — tendon work.',                   wins:'No pain during step downs',            improvements:'Still some achiness after', movements:'Step downs, Clamshell, Terminal knee ext.' },
          { id: uid('j',7), date: d(10), type:'HIIT',      duration:30, rpe:8, mood:3, notes:'Tough HIIT session — form broke down toward the end.',        wins:'Hit all rounds',                       improvements:'Keep form in final rounds', movements:'Burpees, Split jumps, Mountain climbers' },
          { id: uid('j',8), date: d(14), type:'Strength',  duration:70, rpe:8, mood:2, notes:'Heavy squat day — pushed too hard, valgus came back.',        wins:'Hit a new weight PR',                  improvements:'Reduce load until mechanics improve', movements:'Squat, Hip thrust, Leg press' },
          { id: uid('j',9), date: d(18), type:'Mobility',  duration:40, rpe:2, mood:4, notes:'Recovery day — full body mobility flow.',                     wins:'Thoracic rotation improved a lot',     improvements:'', movements:'Thoracic rotation, Hip flexor stretch, Foam roll' },
        ]

        const now = new Date()
        const nextMonday = new Date(now); nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7 || 7)
        const plannedSessions = [
          { id: uid('p',0), date: d(3),  type:'Strength',  duration:60, intensity:3, notes:'Squat focus',      movements:'Squat, Bulgarian split, Step down', completed:true  },
          { id: uid('p',1), date: d(5),  type:'Cardio',    duration:35, intensity:2, notes:'Easy run',         movements:'Running 4km',                       completed:true  },
          { id: uid('p',2), date: d(7),  type:'Rehab',     duration:25, intensity:1, notes:'Knee rehab',       movements:'Step downs, Clamshell',             completed:true  },
          { id: uid('p',3), date: new Date(Date.now() + 1*86400000).toISOString(), type:'Strength',  duration:60, intensity:3, notes:'Deadlift day', movements:'Deadlift, RDL, Bird dog', completed:false },
          { id: uid('p',4), date: new Date(Date.now() + 3*86400000).toISOString(), type:'Cardio',    duration:40, intensity:2, notes:'Cardio',        movements:'Running 5km',               completed:false },
          { id: uid('p',5), date: new Date(Date.now() + 5*86400000).toISOString(), type:'Mobility',  duration:30, intensity:1, notes:'Hip mobility',  movements:'Hip 90-90, Cossack squat', completed:false },
          { id: uid('p',6), date: nextMonday.toISOString(),                         type:'HIIT',      duration:30, intensity:4, notes:'Conditioning', movements:'Box jumps, Band work',       completed:false },
        ]

        const injuries = [
          { id: uid('i',0), dateOccurred: d(13), bodyPart:'Right Knee', type:'Tendinopathy', severity:2, notes:'Developed after increasing squat volume — right patellar tendon soreness post-session.',
            healingLogs:[
              { id: uid('hl',0), date: d(0),  painLevel:3, notes:'Much better after a deload week. Almost pain-free.' },
              { id: uid('hl',1), date: d(3),  painLevel:5, notes:'Still sore after the jump session. Iced post-workout.' },
              { id: uid('hl',2), date: d(7),  painLevel:6, notes:'Significant ache during step-downs. Took a rest day.' },
              { id: uid('hl',3), date: d(13), painLevel:8, notes:'Sharp onset after heavy squat session. First noticed it here.' },
            ], resolved:false, resolvedDate:null },
          { id: uid('i',1), dateOccurred: d(42), bodyPart:'Lower Back', type:'Strain', severity:3, notes:'Pulled during deadlifts — tried too much weight with poor bracing. Painful for 10 days.',
            healingLogs:[
              { id: uid('hl',4), date: d(28), painLevel:2, notes:'Mostly healed. Returning to light deadlifts.' },
              { id: uid('hl',5), date: d(35), painLevel:5, notes:'Still tight but manageable with heat and stretching.' },
              { id: uid('hl',6), date: d(42), painLevel:9, notes:'Acute injury — could barely stand up. Iced and rested.' },
            ], resolved:true, resolvedDate:d(22) },
        ]

        const weightBase = 79.2
        const weightLogs = Array.from({ length: 14 }, (_, i) => ({
          id: uid('w', i),
          date: d(i * 2),
          weight: parseFloat((weightBase - i * 0.06 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          notes: ['After morning training', 'Fasted', '', 'Post-rest day', '', 'Morning weigh-in', '', 'After hydration day', '', '', 'Pre-competition weigh', '', '', 'Normal morning'][i] ?? '',
        })).reverse()

        const challengeProgress = {
          'squat-form-7':   { joined:true, startDate:d(4), daysCompleted:[0,1,2,3].map(dayStr), completed:false },
          'injury-free-14': { joined:true, startDate:d(7), daysCompleted:[3,4,5,6,7].map(dayStr), completed:false },
        }

        const earnedAchievements = ['first_analysis','ten_analyses','low_risk','streak_3','streak_7','improvement_10','improvement_30','five_movements','perfect_squat','goal_achieved','recovery_7']

        set({
          isAuthenticated: true,
          authUser: { id: 1, name: 'Alex Rivera', email: 'demo@injurylens.com' },
          authToken: 'demo-token',
          screen: 'upload',
          history,
          goals,
          recoveryLogs,
          journalEntries,
          plannedSessions,
          injuries,
          challengeProgress,
          athleteMetrics: { weight:79, height:182, sport:'Football', trainingAge:5, position:'Midfielder', weightLogs },
          savedPrescriptions: [
            { id: uid('sp',0), exerciseId:'clamshell',              name:'Clamshell',              category:'Rehab',     favorite:true,  savedAt:d(10) },
            { id: uid('sp',1), exerciseId:'lateral-walk',           name:'Lateral Band Walk',      category:'Activation',favorite:true,  savedAt:d(12) },
            { id: uid('sp',2), exerciseId:'bird-dog',               name:'Bird Dog',               category:'Core',      favorite:false, savedAt:d(15) },
            { id: uid('sp',3), exerciseId:'step-down',              name:'Eccentric Step Down',    category:'Rehab',     favorite:true,  savedAt:d(8) },
            { id: uid('sp',4), exerciseId:'band-external-rotation', name:'Band External Rotation', category:'Rehab',     favorite:false, savedAt:d(20) },
          ],
          earnedAchievements,
          streak: 7,
          longestStreak: 7,
          totalXP: 2100,
          weeklyChallenge: { goal:3, completedThisWeek:1, weekStart:todayStr },
          sessionNotes: {},
          profiles: [DEFAULT_PROFILE],
          activeProfileId: 'default',
          results: null, error: null, isLoading: false, compareData: null,
        })
      },

      registerUser: async (name, email, password) => {
        const res = await fetch(`${AUTH_API}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Registration failed.')
        set({ isAuthenticated: true, authUser: data.user, authToken: data.access_token })
        return data
      },

      loginUser: async (email, password) => {
        const res = await fetch(`${AUTH_API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Login failed.')
        set({ isAuthenticated: true, authUser: data.user, authToken: data.access_token })
        return data
      },

      forgotPassword: async (email) => {
        const res = await fetch(`${AUTH_API}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Request failed.')
        return data
      },

      resetPassword: async (token, newPassword) => {
        const res = await fetch(`${AUTH_API}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, new_password: newPassword }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Reset failed.')
        return data
      },

      // ── App screens ──────────────────────────────────────────────────────────
      screen: 'upload',
      results: null,
      error: null,
      isLoading: false,
      history: [],
      compareData: null,
      settings: {
        autoSaveHistory: true,
        showTimeline: true,
        showBodyMap: true,
        showWarmup: true,
        showWeeklyPlan: true,
        units: 'metric',
        weeklyReportDay: 'Sunday',
        riskAlertThreshold: 60,
        showRiskAlerts: true,
        compactSidebar: false,
      },

      // ── Goals & Training Plans ───────────────────────────────────────────────
      goals: [],

      addGoal: (goal) => {
        const newGoal = {
          ...goal,
          id: String(Date.now()),
          created: new Date().toISOString(),
          achieved: false,
          achievedDate: null,
        }
        set((state) => ({ goals: [...state.goals, newGoal] }))
        get()._updateGamification(get().history)
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }))
        get()._updateGamification(get().history)
      },

      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      markGoalAchieved: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, achieved: true, achievedDate: new Date().toISOString() } : g
          ),
        }))
        get()._updateGamification(get().history)
      },

      // ── Recovery Logs ────────────────────────────────────────────────────────
      recoveryLogs: [],

      addRecoveryLog: (log) => {
        const readiness = computeReadiness(log.sleep ?? 7, log.soreness ?? 1, log.energy ?? 3)
        const newLog = {
          ...log,
          id: String(Date.now()),
          date: new Date().toISOString(),
          readiness,
        }
        set((state) => ({ recoveryLogs: [newLog, ...state.recoveryLogs].slice(0, 90) }))
        get()._updateGamification(get().history)
      },

      updateRecoveryLog: (id, updates) =>
        set((state) => ({
          recoveryLogs: state.recoveryLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      deleteRecoveryLog: (id) =>
        set((state) => ({ recoveryLogs: state.recoveryLogs.filter((l) => l.id !== id) })),

      // ── Session Notes ────────────────────────────────────────────────────────
      sessionNotes: {},

      updateSessionNote: (historyId, noteData) =>
        set((state) => ({
          sessionNotes: { ...state.sessionNotes, [historyId]: { ...state.sessionNotes[historyId], ...noteData } },
        })),

      deleteSessionNote: (historyId) =>
        set((state) => {
          const { [historyId]: _, ...rest } = state.sessionNotes
          return { sessionNotes: rest }
        }),

      // ── Athlete profiles ─────────────────────────────────────────────────────
      profiles: [DEFAULT_PROFILE],
      activeProfileId: 'default',

      addProfile: (profile) => {
        const newProfile = { ...profile, id: String(Date.now()), createdAt: new Date().toISOString() }
        set((state) => ({ profiles: [...state.profiles, newProfile] }))
        return newProfile.id
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId: state.activeProfileId === id ? 'default' : state.activeProfileId,
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const state = get()
        return state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0] ?? DEFAULT_PROFILE
      },

      // ── Gamification ─────────────────────────────────────────────────────────
      streak: 0,
      longestStreak: 0,
      earnedAchievements: [],
      weeklyChallenge: {
        goal: 3,
        completedThisWeek: 0,
        weekStart: null,
      },
      totalXP: 0,

      _updateGamification: (history) => {
        const state     = get()
        const streak    = computeStreak(history)
        const earned    = computeAchievements(history, streak, state.goals, state.recoveryLogs)
        const longest   = Math.max(state.longestStreak, streak)
        const now       = new Date()
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toDateString()
        const weeklyCount = history.filter((h) => {
          const d = new Date(h.date)
          return d >= new Date(weekStart)
        }).length
        // compute XP from earned achievements
        const totalXP = ACHIEVEMENTS.filter((a) => earned.includes(a.id)).reduce((s, a) => s + (a.xp ?? 0), 0)
        set({
          streak,
          longestStreak: longest,
          earnedAchievements: earned,
          totalXP,
          weeklyChallenge: {
            ...state.weeklyChallenge,
            completedThisWeek: weeklyCount,
            weekStart,
          },
        })
      },

      // ── Core navigation ──────────────────────────────────────────────────────
      setScreen: (screen) => set({ screen }),

      setResults: (results) => {
        set({ results, screen: 'results', error: null, isLoading: false })
        if (get().settings.autoSaveHistory && results) {
          get()._saveToHistory(results)
        }
      },

      setError: (error) =>
        set({
          error:
            typeof error === 'string'
              ? { message: error, suggestion: 'Please try again.' }
              : error,
          screen: 'upload',
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set({ screen: 'upload', results: null, error: null, isLoading: false }),

      _saveToHistory: (results) => {
        const entry = {
          id: results.analysis_id || String(Date.now()),
          date: new Date().toISOString(),
          movement_type: results.movement_type,
          scores: results.scores,
          supplementary: {
            avg_left_knee_angle:   results.supplementary?.avg_left_knee_angle,
            avg_right_knee_angle:  results.supplementary?.avg_right_knee_angle,
            avg_trunk_lean_angle:  results.supplementary?.avg_trunk_lean_angle,
            total_frames_analyzed: results.supplementary?.total_frames_analyzed,
            rep_count:             results.supplementary?.rep_count,
            fatigue_score:         results.supplementary?.fatigue_score,
            mqs_score:             results.supplementary?.mqs_score,
            mqs_grade:             results.supplementary?.mqs_grade,
            injury_probability_4w: results.supplementary?.injury_probability_4w,
          },
          ai_coaching: {
            overall_risk_level: results.ai_coaching?.overall_risk_level,
            overall_summary:    results.ai_coaching?.overall_summary,
            priority_issue:     results.ai_coaching?.priority_issue,
          },
          annotated_frame: results.annotated_frame,
          profileId: get().activeProfileId,
        }
        const newHistory = [entry, ...get().history.filter((h) => h.id !== entry.id)].slice(0, 50)
        set({ history: newHistory })
        get()._updateGamification(newHistory)
        // auto-check goals
        get()._checkGoalProgress(entry)
      },

      saveCurrentToHistory: () => {
        const results = get().results
        if (results) get()._saveToHistory(results)
      },

      removeFromHistory: (id) => {
        const newHistory = get().history.filter((h) => h.id !== id)
        set({ history: newHistory })
        get()._updateGamification(newHistory)
      },

      clearHistory: () => {
        set({ history: [], streak: 0, earnedAchievements: [], weeklyChallenge: { goal: 3, completedThisWeek: 0, weekStart: null }, totalXP: 0 })
      },

      viewHistoryItem: (id) => {
        const entry = get().history.find((h) => h.id === id)
        if (entry) {
          get().setResults({ ...entry, analysis_id: entry.id })
        }
      },

      setCompareData: (data) => set({ compareData: data }),
      clearCompare:   () => set({ compareData: null }),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      // ── Goal progress auto-check ─────────────────────────────────────────────
      _checkGoalProgress: (latestEntry) => {
        const state = get()
        state.goals.forEach((goal) => {
          if (goal.achieved) return
          const metricMap = {
            overall:          latestEntry.scores?.overall,
            knee_valgus_left:  latestEntry.scores?.knee_valgus_left,
            knee_valgus_right: latestEntry.scores?.knee_valgus_right,
            trunk_lean:        latestEntry.scores?.trunk_lean,
            asymmetry:         latestEntry.scores?.asymmetry,
            shoulder:          latestEntry.scores?.shoulder,
          }
          const current = metricMap[goal.metric]
          if (current !== undefined && goal.movement_type === latestEntry.movement_type) {
            if (current <= goal.target) {
              get().markGoalAchieved(goal.id)
            }
          }
        })
      },

      // ── Risk Alerts ──────────────────────────────────────────────────────────
      getRiskAlerts: () => {
        const { history, settings } = get()
        if (history.length < 3) return []
        const alerts = []
        const recent = history.slice(0, 5)
        const metrics = ['overall', 'knee_valgus_left', 'knee_valgus_right', 'trunk_lean', 'asymmetry']
        const labels  = { overall: 'Overall Risk', knee_valgus_left: 'Left Knee Valgus', knee_valgus_right: 'Right Knee Valgus', trunk_lean: 'Trunk Lean', asymmetry: 'Bilateral Asymmetry' }

        metrics.forEach((m) => {
          const vals = recent.map((h) => h.scores?.[m]).filter((v) => v != null)
          if (vals.length < 2) return
          const latest = vals[0]
          if (latest > (settings.riskAlertThreshold ?? 60)) {
            alerts.push({ type: 'high', metric: m, label: labels[m], value: latest, message: `${labels[m]} is critically high at ${latest}%` })
          } else if (vals.length >= 3 && vals[0] > vals[vals.length - 1] + 10) {
            alerts.push({ type: 'worsening', metric: m, label: labels[m], value: latest, message: `${labels[m]} has worsened by ${Math.round(vals[0] - vals[vals.length-1])} points recently` })
          }
        })
        return alerts
      },

      // ── Injury Tracker ───────────────────────────────────────────────────────
      injuries: [],

      addInjury: (injury) => {
        const newInjury = {
          ...injury,
          id: String(Date.now()),
          dateOccurred: injury.dateOccurred || new Date().toISOString(),
          healingLogs: [],
          resolved: false,
          resolvedDate: null,
        }
        set((state) => ({ injuries: [newInjury, ...state.injuries] }))
      },

      updateInjury: (id, updates) =>
        set((state) => ({
          injuries: state.injuries.map((inj) => (inj.id === id ? { ...inj, ...updates } : inj)),
        })),

      addHealingLog: (injuryId, log) =>
        set((state) => ({
          injuries: state.injuries.map((inj) =>
            inj.id === injuryId
              ? { ...inj, healingLogs: [{ ...log, id: String(Date.now()), date: new Date().toISOString() }, ...inj.healingLogs] }
              : inj
          ),
        })),

      resolveInjury: (id) =>
        set((state) => ({
          injuries: state.injuries.map((inj) =>
            inj.id === id ? { ...inj, resolved: true, resolvedDate: new Date().toISOString() } : inj
          ),
        })),

      deleteInjury: (id) =>
        set((state) => ({ injuries: state.injuries.filter((inj) => inj.id !== id) })),

      // ── Training Journal ─────────────────────────────────────────────────────
      journalEntries: [],

      addJournalEntry: (entry) => {
        const newEntry = { ...entry, id: String(Date.now()), date: entry.date || new Date().toISOString() }
        set((state) => ({ journalEntries: [newEntry, ...state.journalEntries].slice(0, 365) }))
      },

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteJournalEntry: (id) =>
        set((state) => ({ journalEntries: state.journalEntries.filter((e) => e.id !== id) })),

      // ── Session Planner ──────────────────────────────────────────────────────
      plannedSessions: [],

      addPlannedSession: (session) => {
        const newSession = { ...session, id: String(Date.now()), completed: false }
        set((state) => ({ plannedSessions: [...state.plannedSessions, newSession].slice(0, 200) }))
      },

      updatePlannedSession: (id, updates) =>
        set((state) => ({
          plannedSessions: state.plannedSessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deletePlannedSession: (id) =>
        set((state) => ({ plannedSessions: state.plannedSessions.filter((s) => s.id !== id) })),

      toggleSessionComplete: (id) =>
        set((state) => ({
          plannedSessions: state.plannedSessions.map((s) =>
            s.id === id ? { ...s, completed: !s.completed } : s
          ),
        })),

      // ── Athlete Metrics ──────────────────────────────────────────────────────
      athleteMetrics: {
        weight: null,
        height: null,
        sport: '',
        trainingAge: 0,
        position: '',
        weightLogs: [],
      },

      updateAthleteMetrics: (updates) =>
        set((state) => ({ athleteMetrics: { ...state.athleteMetrics, ...updates } })),

      addWeightLog: (weight, notes = '') => {
        const log = { id: String(Date.now()), date: new Date().toISOString(), weight: Number(weight), notes }
        set((state) => ({
          athleteMetrics: {
            ...state.athleteMetrics,
            weight: Number(weight),
            weightLogs: [log, ...state.athleteMetrics.weightLogs].slice(0, 180),
          },
        }))
      },

      // ── Saved Exercise Prescriptions ─────────────────────────────────────────
      savedPrescriptions: [],

      addPrescription: (exercise) => {
        const newEx = { ...exercise, id: String(Date.now()), savedAt: new Date().toISOString(), favorite: false }
        set((state) => ({ savedPrescriptions: [newEx, ...state.savedPrescriptions] }))
      },

      togglePrescriptionFavorite: (id) =>
        set((state) => ({
          savedPrescriptions: state.savedPrescriptions.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite } : p
          ),
        })),

      deletePrescription: (id) =>
        set((state) => ({ savedPrescriptions: state.savedPrescriptions.filter((p) => p.id !== id) })),

      // ── Challenge Progress ───────────────────────────────────────────────────
      challengeProgress: {},

      joinChallenge: (challengeId) =>
        set((state) => ({
          challengeProgress: {
            ...state.challengeProgress,
            [challengeId]: { joined: true, startDate: new Date().toISOString(), daysCompleted: [], completed: false },
          },
        })),

      completeChallengeDay: (challengeId) => {
        const today = new Date().toDateString()
        set((state) => {
          const prog = state.challengeProgress[challengeId]
          if (!prog || prog.daysCompleted.includes(today)) return {}
          const newDays = [...prog.daysCompleted, today]
          return {
            challengeProgress: {
              ...state.challengeProgress,
              [challengeId]: { ...prog, daysCompleted: newDays, completed: prog.completed },
            },
          }
        })
      },

      leaveChallenge: (challengeId) => {
        set((state) => {
          const { [challengeId]: _, ...rest } = state.challengeProgress
          return { challengeProgress: rest }
        })
      },
    }),
    {
      name: 'injurylens-v6',
      partialize: (state) => ({
        isAuthenticated:     state.isAuthenticated,
        authUser:            state.authUser,
        authToken:           state.authToken,
        history:             state.history,
        settings:            state.settings,
        profiles:            state.profiles,
        activeProfileId:     state.activeProfileId,
        streak:              state.streak,
        longestStreak:       state.longestStreak,
        earnedAchievements:  state.earnedAchievements,
        weeklyChallenge:     state.weeklyChallenge,
        totalXP:             state.totalXP,
        goals:               state.goals,
        recoveryLogs:        state.recoveryLogs,
        sessionNotes:        state.sessionNotes,
        injuries:            state.injuries,
        journalEntries:      state.journalEntries,
        plannedSessions:     state.plannedSessions,
        athleteMetrics:      state.athleteMetrics,
        savedPrescriptions:  state.savedPrescriptions,
        challengeProgress:   state.challengeProgress,
      }),
    }
  )
)

export { ACHIEVEMENTS }
