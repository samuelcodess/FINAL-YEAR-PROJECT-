export type LearningModule = {
  title: string;
  objective: string;
  lessons: string[];
  practiceTask: string;
  checkpoint: string;
};

export type ResourceDocument = {
  id: string;
  title: string;
  format: string;
  targetArea: string;
  estimatedDuration: string;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  recommendedFor: string;
  summary: string;
  whyItMatters: string;
  learningObjectives: string[];
  modules: LearningModule[];
  finalAssignment: string;
  successIndicators: string[];
  managerFollowUp: string;
};

export type ExternalLearningLink = {
  title: string;
  provider: string;
  url: string;
  type: "course" | "guide" | "documentation" | "video";
};

export type PathwayGoalCard = {
  title: string;
  detail: string;
};

export type PathwayMilestone = {
  title: string;
  description: string;
};

function createLearningPath(input: ResourceDocument): ResourceDocument {
  return input;
}

export const resourceLibrary: Record<string, ResourceDocument> = {
  "type-promotion-leadership-readiness-checklist": createLearningPath({
    id: "type-promotion-leadership-readiness-checklist",
    title: "Leadership readiness pathway",
    format: "Mini course",
    targetArea: "Career growth",
    estimatedDuration: "1-2 hours",
    difficulty: "Advanced",
    recommendedFor: "Employees consistently performing at a high level and being considered for advancement.",
    summary: "A structured leadership-readiness pathway that helps strong performers assess whether they are ready for promotion and broader responsibility.",
    whyItMatters: "Promotion decisions should be supported by more than just a high score. This pathway helps connect strong performance to leadership readiness, decision-making maturity, and strategic contribution.",
    learningObjectives: [
      "Identify the behavioral patterns expected from a future team lead or senior contributor.",
      "Assess readiness for broader ownership beyond daily task delivery.",
      "Prepare evidence and reflection points for promotion discussions."
    ],
    modules: [
      {
        title: "Module 1: Performance-to-potential review",
        objective: "Understand the difference between strong output and true readiness for advancement.",
        lessons: [
          "Review recent achievements and categorize them into delivery, collaboration, and leadership behavior.",
          "Identify which contributions improved the wider team, not only personal output.",
          "Reflect on whether strong performance is consistent or situational."
        ],
        practiceTask: "Write a short promotion-readiness summary using three recent examples of high-impact contribution.",
        checkpoint: "The employee can explain why their performance supports greater responsibility."
      },
      {
        title: "Module 2: Leadership behavior assessment",
        objective: "Measure leadership readiness through communication, ownership, and decision support.",
        lessons: [
          "Assess how the employee handles delegation, support, and accountability.",
          "Identify situations where they helped unblock others or improved a process.",
          "Review how they communicate under pressure or ambiguity."
        ],
        practiceTask: "Document one example of mentoring, one example of initiative, and one example of problem ownership.",
        checkpoint: "The employee can point to observable leadership behavior, not only output."
      },
      {
        title: "Module 3: Promotion conversation preparation",
        objective: "Prepare for a realistic growth discussion with HR or the reporting manager.",
        lessons: [
          "Translate achievements into promotion-ready evidence.",
          "Identify one remaining development gap before the next level.",
          "Set a proposed growth plan for the next quarter."
        ],
        practiceTask: "Prepare a one-page growth brief for an advancement meeting.",
        checkpoint: "The employee has a clear narrative for readiness, growth gaps, and next-step expectations."
      }
    ],
    finalAssignment: "Submit a promotion-readiness brief with evidence of contribution, leadership behavior, and one recommended next-step goal.",
    successIndicators: [
      "Can articulate readiness using real examples.",
      "Can identify one remaining development gap honestly.",
      "Shows strategic thinking beyond individual work completion."
    ],
    managerFollowUp: "Manager should review the brief and schedule a structured readiness discussion."
  }),
  "type-leadership-team-leadership-starter-guide": createLearningPath({
    id: "type-leadership-team-leadership-starter-guide",
    title: "Team leadership starter pathway",
    format: "Mini course",
    targetArea: "Leadership",
    estimatedDuration: "2 hours",
    difficulty: "Intermediate",
    recommendedFor: "Employees being prepared for leadership opportunities, project coordination, or team supervision.",
    summary: "A structured learning path for employees moving from strong individual contribution into people-facing or coordination responsibilities.",
    whyItMatters: "Leadership success depends on communication, follow-through, and the ability to support team outcomes, not only personal delivery.",
    learningObjectives: [
      "Understand the shift from doing the work to guiding the work.",
      "Practice core leadership communication behaviors.",
      "Learn how to structure simple team coordination routines."
    ],
    modules: [
      {
        title: "Module 1: From contributor to coordinator",
        objective: "Understand what changes when responsibility expands from self-management to team support.",
        lessons: [
          "Compare individual ownership with shared-output accountability.",
          "Recognize situations that require leadership presence instead of personal execution.",
          "Learn how expectations change when others depend on your direction."
        ],
        practiceTask: "Describe one task you could coordinate instead of handling entirely alone.",
        checkpoint: "The employee can explain the practical difference between contribution and leadership."
      },
      {
        title: "Module 2: Leadership communication habits",
        objective: "Build clear communication patterns for guiding others.",
        lessons: [
          "Set expectations clearly and confirm understanding.",
          "Use supportive follow-up rather than vague reminders.",
          "Practice giving corrective feedback without creating confusion."
        ],
        practiceTask: "Draft a short work instruction message and a follow-up message for missed delivery.",
        checkpoint: "The employee communicates directions and follow-up with clarity."
      },
      {
        title: "Module 3: Running simple leadership routines",
        objective: "Use repeatable routines to keep work visible and coordinated.",
        lessons: [
          "Structure short check-ins with clear outcomes.",
          "Track blockers and assign follow-up actions.",
          "Use consistent documentation for decisions and expectations."
        ],
        practiceTask: "Run one short meeting using an agenda and action list.",
        checkpoint: "The employee can lead a basic coordination routine successfully."
      }
    ],
    finalAssignment: "Lead one structured check-in or team coordination session and document the outcomes.",
    successIndicators: [
      "Gives clear directions and follow-up.",
      "Documents actions and expectations.",
      "Helps others move work forward consistently."
    ],
    managerFollowUp: "Observe one live coordination activity and provide feedback on clarity, control, and support."
  }),
  "type-bonus-high-performance-recognition-brief": createLearningPath({
    id: "type-bonus-high-performance-recognition-brief",
    title: "High performance sustainability pathway",
    format: "Mini course",
    targetArea: "Performance maintenance",
    estimatedDuration: "45-60 minutes",
    difficulty: "Intermediate",
    recommendedFor: "Employees with very good or excellent evaluations who need guidance on sustaining strong results.",
    summary: "A structured path for converting current high performance into sustainable professional habits and future growth.",
    whyItMatters: "Recognition is strongest when it reinforces the habits behind success and helps the employee scale their contribution instead of plateauing.",
    learningObjectives: [
      "Identify the habits that produced strong performance.",
      "Translate strong evaluation results into repeatable routines.",
      "Set one stretch objective for the next review cycle."
    ],
    modules: [
      {
        title: "Module 1: Identify what is working",
        objective: "Break strong performance into observable habits and systems.",
        lessons: [
          "Review recent wins and link them to behaviors.",
          "Separate luck or timing from repeatable strengths.",
          "Identify what should be protected going forward."
        ],
        practiceTask: "List three habits that directly contributed to your strong score.",
        checkpoint: "The employee understands the drivers of their success."
      },
      {
        title: "Module 2: Prevent performance drop-off",
        objective: "Protect performance consistency during workload changes or role growth.",
        lessons: [
          "Review common reasons strong performers lose consistency.",
          "Create routines that preserve delivery quality.",
          "Maintain communication and prioritization under pressure."
        ],
        practiceTask: "Write a simple routine for maintaining quality during a busy week.",
        checkpoint: "The employee has a stability plan, not just ambition."
      },
      {
        title: "Module 3: Set the next stretch target",
        objective: "Use recognition as a platform for future development.",
        lessons: [
          "Choose one new challenge that expands impact.",
          "Set a realistic but stretching target.",
          "Align the next target with team or department outcomes."
        ],
        practiceTask: "Define one stretch goal with timeline and success evidence.",
        checkpoint: "The employee moves from recognition into structured growth."
      }
    ],
    finalAssignment: "Submit a one-page performance sustainability and stretch-goal plan.",
    successIndicators: [
      "Understands the habits behind current success.",
      "Has a plan to maintain consistency.",
      "Sets a forward-looking growth objective."
    ],
    managerFollowUp: "Review the stretch target and align it with upcoming departmental priorities."
  }),
  "type-advanced_responsibility-stretch-assignment-planning-worksheet": createLearningPath({
    id: "type-advanced_responsibility-stretch-assignment-planning-worksheet",
    title: "Advanced responsibility pathway",
    format: "Mini course",
    targetArea: "Responsibility growth",
    estimatedDuration: "1-2 hours",
    difficulty: "Intermediate",
    recommendedFor: "Employees being trusted with larger or more complex assignments.",
    summary: "A learning path for preparing employees to handle stretch assignments with structure, clarity, and support.",
    whyItMatters: "New responsibility should build confidence and capability, not confusion. This path helps employees and managers make advanced tasks manageable.",
    learningObjectives: [
      "Break advanced responsibilities into realistic milestones.",
      "Clarify expectations, support needs, and success evidence.",
      "Reduce failure risk during growth assignments."
    ],
    modules: [
      {
        title: "Module 1: Define the stretch assignment",
        objective: "Clarify what the new responsibility actually involves.",
        lessons: [
          "Translate the assignment into expected outcomes.",
          "Separate mandatory tasks from developmental tasks.",
          "Identify what success should look like."
        ],
        practiceTask: "Write a clear responsibility statement for the assignment.",
        checkpoint: "The employee understands what the assignment expects."
      },
      {
        title: "Module 2: Build milestones and support points",
        objective: "Structure the assignment so progress is visible and manageable.",
        lessons: [
          "Break the work into stages.",
          "Attach dates, owners, and escalation points.",
          "Identify where support or coaching is needed."
        ],
        practiceTask: "Design a milestone plan with at least three stages.",
        checkpoint: "The assignment is structured into manageable checkpoints."
      },
      {
        title: "Module 3: Deliver and reflect",
        objective: "Use the assignment as a learning experience, not just a test.",
        lessons: [
          "Document what worked during execution.",
          "Capture blockers and how they were handled.",
          "Convert the assignment into evidence of readiness for more responsibility."
        ],
        practiceTask: "Write a short reflection after completing one milestone.",
        checkpoint: "The employee can explain what was learned through the assignment."
      }
    ],
    finalAssignment: "Complete a stretch-assignment plan with milestones, review dates, and learning notes.",
    successIndicators: [
      "Can describe the assignment clearly.",
      "Can track progress across milestones.",
      "Learns from execution rather than only reporting outcomes."
    ],
    managerFollowUp: "Review milestone progress and coach on risk areas before final delivery."
  }),
  "type-training-targeted-improvement-plan-template": createLearningPath({
    id: "type-training-targeted-improvement-plan-template",
    title: "Targeted improvement pathway",
    format: "Mini course",
    targetArea: "Training",
    estimatedDuration: "2-3 hours",
    difficulty: "Foundation",
    recommendedFor: "Employees whose scores suggest a training intervention is needed in one or more KPI areas.",
    summary: "A structured improvement pathway that converts weak KPI areas into a training plan with goals, practice, and review checkpoints.",
    whyItMatters: "Employees improve more effectively when weak areas are diagnosed clearly and matched to concrete development actions instead of vague advice.",
    learningObjectives: [
      "Interpret low-scoring KPI areas correctly.",
      "Translate weak areas into practical learning goals.",
      "Create a follow-up plan with evidence of improvement."
    ],
    modules: [
      {
        title: "Module 1: Diagnose the weak areas",
        objective: "Understand exactly which KPI areas need improvement and why.",
        lessons: [
          "Review the recent evaluation in detail.",
          "Identify the lowest KPI scores and compare them with stronger areas.",
          "Discuss likely performance causes with the supervisor or HR."
        ],
        practiceTask: "Write a diagnosis statement for each weak KPI area.",
        checkpoint: "The employee can explain what needs improvement in specific terms."
      },
      {
        title: "Module 2: Build a focused training plan",
        objective: "Turn diagnosis into realistic development actions.",
        lessons: [
          "Set one learning goal for each weak area.",
          "Choose one practical action to improve each goal.",
          "Define what evidence of progress will look like."
        ],
        practiceTask: "Create a simple training table with area, action, timeline, and expected result.",
        checkpoint: "Each weak area has a matching development action."
      },
      {
        title: "Module 3: Track and review progress",
        objective: "Use follow-up evidence instead of waiting passively for the next evaluation.",
        lessons: [
          "Record practice actions and outcomes weekly.",
          "Collect examples that show improvement.",
          "Prepare for a structured review with the manager."
        ],
        practiceTask: "Log one week of improvement evidence for each weak area.",
        checkpoint: "The employee can present early proof of progress."
      }
    ],
    finalAssignment: "Submit an improvement plan with KPI diagnosis, learning goals, weekly actions, and review dates.",
    successIndicators: [
      "Weak areas are clearly identified.",
      "Training actions are specific and measurable.",
      "Progress is tracked before the next formal evaluation."
    ],
    managerFollowUp: "Manager should review the plan, validate the actions, and approve follow-up checkpoints."
  }),
  "type-skill_development-skill-development-action-tracker": createLearningPath({
    id: "type-skill_development-skill-development-action-tracker",
    title: "Skill development pathway",
    format: "Mini course",
    targetArea: "Skill development",
    estimatedDuration: "2 hours plus weekly practice",
    difficulty: "Foundation",
    recommendedFor: "Employees who need steady development in one or more capability areas over time.",
    summary: "A guided skill-development path that helps employees build capability gradually through repeated practice and evidence tracking.",
    whyItMatters: "Skill gaps close through repetition, feedback, and visible progress. A structured path makes development more realistic and measurable.",
    learningObjectives: [
      "Choose a specific skill gap to improve.",
      "Break development into repeated practice cycles.",
      "Track progress with practical evidence."
    ],
    modules: [
      {
        title: "Module 1: Define the development target",
        objective: "Translate a weak area into one concrete skill to improve.",
        lessons: [
          "Distinguish between broad weakness and specific skill gap.",
          "Choose one priority development area first.",
          "Describe what better performance would look like."
        ],
        practiceTask: "Write a short before-and-after description of the target skill.",
        checkpoint: "The skill target is clear and measurable."
      },
      {
        title: "Module 2: Build a practice cycle",
        objective: "Create a sustainable routine for weekly development.",
        lessons: [
          "Design short, repeatable practice tasks.",
          "Identify when and where practice will happen.",
          "Decide how feedback will be collected."
        ],
        practiceTask: "Create a weekly practice schedule for two to four weeks.",
        checkpoint: "The employee has a realistic routine for skill development."
      },
      {
        title: "Module 3: Measure progress",
        objective: "Use small evidence points to show development over time.",
        lessons: [
          "Capture examples of improved work behavior.",
          "Compare current output to the starting point.",
          "Prepare a short progress review."
        ],
        practiceTask: "Record two examples that demonstrate development progress.",
        checkpoint: "The employee can show evidence instead of relying on opinion."
      }
    ],
    finalAssignment: "Prepare a short skill-development report showing the target skill, practice routine, and evidence of improvement.",
    successIndicators: [
      "Development target is specific.",
      "Practice routine is maintained weekly.",
      "Improvement evidence is documented clearly."
    ],
    managerFollowUp: "Review the employee’s tracker after two to four weeks and adjust the development focus if needed."
  }),
  "type-performance_improvement_plan-performance-recovery-plan": createLearningPath({
    id: "type-performance_improvement_plan-performance-recovery-plan",
    title: "Performance recovery pathway",
    format: "Mini course",
    targetArea: "Performance recovery",
    estimatedDuration: "3 hours plus follow-up",
    difficulty: "Foundation",
    recommendedFor: "Employees with average or poor performance outcomes who need structured support and close follow-up.",
    summary: "A formal recovery path for helping employees move from poor performance toward stable, acceptable performance.",
    whyItMatters: "Poor performance should trigger structured support with measurable expectations, not only criticism or informal advice.",
    learningObjectives: [
      "Identify the causes behind the current poor outcome.",
      "Convert performance issues into a realistic recovery plan.",
      "Demonstrate progress through short review cycles."
    ],
    modules: [
      {
        title: "Module 1: Clarify the performance issue",
        objective: "Define the current performance gap without ambiguity.",
        lessons: [
          "Review recent score outcomes and weak KPI areas.",
          "Separate performance symptoms from root causes.",
          "Document the exact behaviors or outputs that need to change."
        ],
        practiceTask: "Write a performance-gap statement with at least two concrete examples.",
        checkpoint: "The problem is clearly described and measurable."
      },
      {
        title: "Module 2: Build the recovery plan",
        objective: "Create a short-cycle action plan with realistic expectations.",
        lessons: [
          "Set recovery targets for the next review period.",
          "Assign support actions and self-improvement actions.",
          "Define when recovery progress will be checked."
        ],
        practiceTask: "Create a 30-day recovery plan with tasks, dates, and success indicators.",
        checkpoint: "The employee has a realistic and supported recovery structure."
      },
      {
        title: "Module 3: Show recovery evidence",
        objective: "Use follow-up checks to demonstrate real progress.",
        lessons: [
          "Track behavior changes and output improvements.",
          "Document what support actions were completed.",
          "Prepare for review conversations with evidence."
        ],
        practiceTask: "Collect one week of evidence showing improved performance behavior.",
        checkpoint: "The employee can show movement toward recovery with facts."
      }
    ],
    finalAssignment: "Submit a performance recovery plan with problem diagnosis, actions, timeline, and first evidence of progress.",
    successIndicators: [
      "Recovery targets are specific.",
      "Support and accountability are both present.",
      "Progress is reviewed in short cycles."
    ],
    managerFollowUp: "Manager and HR should review progress on a fixed short-cycle schedule."
  }),
  "type-recognition-recognition-and-growth-reflection-sheet": createLearningPath({
    id: "type-recognition-recognition-and-growth-reflection-sheet",
    title: "Recognition and growth pathway",
    format: "Mini course",
    targetArea: "Recognition",
    estimatedDuration: "45 minutes",
    difficulty: "Foundation",
    recommendedFor: "Employees showing steady improvement or strong current performance who should reflect on what is working.",
    summary: "A short guided reflection path that helps employees turn recognition into growth planning.",
    whyItMatters: "Recognition becomes more useful when it helps employees understand what they are doing well and how to build on it deliberately.",
    learningObjectives: [
      "Identify the strengths behind recent strong performance.",
      "Capture behaviors worth repeating.",
      "Turn recognition into a forward-looking development plan."
    ],
    modules: [
      {
        title: "Module 1: Recognize current strengths",
        objective: "Name the behaviors and habits responsible for recent success.",
        lessons: [
          "Review recent positive feedback or strong results.",
          "Link strengths to actual work behaviors.",
          "Identify what should be sustained."
        ],
        practiceTask: "Write two strength statements using recent examples.",
        checkpoint: "The employee can explain what is working well."
      },
      {
        title: "Module 2: Protect the strengths",
        objective: "Create habits that help maintain strong performance.",
        lessons: [
          "Identify what might weaken current strengths over time.",
          "Choose routines that preserve good performance.",
          "Review how to stay consistent under changing demands."
        ],
        practiceTask: "Write one routine that helps preserve each major strength.",
        checkpoint: "The employee has a plan to sustain performance."
      },
      {
        title: "Module 3: Extend the growth path",
        objective: "Use recognition as a base for future development.",
        lessons: [
          "Choose one next capability to improve.",
          "Connect strengths to a future opportunity.",
          "Set a small but meaningful next-step target."
        ],
        practiceTask: "Define one next-step development goal and why it matters.",
        checkpoint: "The employee turns reflection into a growth decision."
      }
    ],
    finalAssignment: "Submit a recognition reflection note with strengths, sustaining habits, and one growth goal.",
    successIndicators: [
      "Can describe current strengths clearly.",
      "Knows how to maintain them.",
      "Sets one concrete next-step objective."
    ],
    managerFollowUp: "Discuss the growth goal and identify whether it aligns with future team needs."
  }),
  "type-warning-support-intervention-checklist": createLearningPath({
    id: "type-warning-support-intervention-checklist",
    title: "Decline intervention pathway",
    format: "Mini course",
    targetArea: "Intervention",
    estimatedDuration: "1-2 hours",
    difficulty: "Intermediate",
    recommendedFor: "Employees or managers dealing with a consistent downward trend across recent evaluations.",
    summary: "A structured intervention path for understanding performance decline and responding early with support.",
    whyItMatters: "Three consecutive declines should lead to thoughtful intervention, not just warning signals. This path supports early correction.",
    learningObjectives: [
      "Interpret a decline trend accurately.",
      "Identify likely causes and support needs.",
      "Create an early intervention plan with follow-up."
    ],
    modules: [
      {
        title: "Module 1: Understand the decline pattern",
        objective: "Read the recent evaluation trend and identify where the drop is happening.",
        lessons: [
          "Compare recent scores across evaluation periods.",
          "Identify whether the decline is broad or concentrated in certain KPIs.",
          "Review remarks, context, and workload patterns."
        ],
        practiceTask: "Write a short summary of the decline pattern using the last three evaluations.",
        checkpoint: "The decline is described with evidence, not assumption."
      },
      {
        title: "Module 2: Diagnose causes and support needs",
        objective: "Look beyond the score to understand what support is needed.",
        lessons: [
          "Separate skill problems from workload, motivation, or communication issues.",
          "Document what information is still missing.",
          "Plan a support discussion rather than a one-sided warning."
        ],
        practiceTask: "Prepare three discussion questions for a support conversation.",
        checkpoint: "The intervention approach includes diagnosis and support."
      },
      {
        title: "Module 3: Build the intervention plan",
        objective: "Create immediate actions and a follow-up schedule.",
        lessons: [
          "Define one immediate support action.",
          "Set a short review timeline.",
          "Assign success indicators and responsibilities."
        ],
        practiceTask: "Create a two-week intervention plan with actions and checkpoints.",
        checkpoint: "The decline response is structured, time-bound, and measurable."
      }
    ],
    finalAssignment: "Submit an intervention note summarizing the decline, likely causes, and the next support actions.",
    successIndicators: [
      "Trend is interpreted accurately.",
      "Support actions are identified early.",
      "Intervention includes measurable follow-up."
    ],
    managerFollowUp: "HR or the supervisor should hold a support review after the first intervention cycle."
  }),
  "kpi-productivity-personal-productivity-playbook": createLearningPath({
    id: "kpi-productivity-personal-productivity-playbook",
    title: "Productivity improvement pathway",
    format: "Mini course",
    targetArea: "Productivity",
    estimatedDuration: "2-3 hours plus practice",
    difficulty: "Foundation",
    recommendedFor: "Employees whose productivity KPI score is low or whose output is inconsistent.",
    summary: "A structured productivity course focused on prioritization, focused work habits, and delivery consistency.",
    whyItMatters: "Productivity heavily affects weighted evaluation scores because it often reflects overall delivery reliability and output consistency.",
    learningObjectives: [
      "Understand what is reducing productive output.",
      "Build a repeatable prioritization routine.",
      "Use focused work habits to improve daily delivery."
    ],
    modules: [
      {
        title: "Module 1: Diagnose productivity blockers",
        objective: "Identify where time and effort are being lost.",
        lessons: [
          "Review task patterns and interruption sources.",
          "Separate essential work from low-value effort.",
          "Recognize common causes of inconsistent output."
        ],
        practiceTask: "Track one day of work and label each activity by value level.",
        checkpoint: "The employee can identify at least two real productivity blockers."
      },
      {
        title: "Module 2: Build a prioritization routine",
        objective: "Create a simple daily structure for handling important work first.",
        lessons: [
          "Use a top-priority list rather than reacting to everything equally.",
          "Group similar tasks to reduce switching costs.",
          "Decide which work can be deferred or escalated."
        ],
        practiceTask: "Create a daily plan using three top priorities and one protected work block.",
        checkpoint: "The employee can plan work more intentionally."
      },
      {
        title: "Module 3: Sustain focused execution",
        objective: "Turn better planning into more reliable output.",
        lessons: [
          "Use focused work blocks and short review breaks.",
          "Track whether planned work was actually completed.",
          "Review the reasons for unfinished work and adapt."
        ],
        practiceTask: "Run the routine for three working days and record the result.",
        checkpoint: "The employee can link the routine to better output consistency."
      }
    ],
    finalAssignment: "Submit a one-week productivity improvement log showing blockers, new routines, and observed results.",
    successIndicators: [
      "Identifies real productivity barriers.",
      "Uses a daily prioritization structure.",
      "Demonstrates better delivery consistency."
    ],
    managerFollowUp: "Review the employee’s one-week log and discuss whether output consistency is improving."
  }),
  "kpi-quality-of-work-quality-assurance-checklist": createLearningPath({
    id: "kpi-quality-of-work-quality-assurance-checklist",
    title: "Quality of work improvement pathway",
    format: "Mini course",
    targetArea: "Quality of Work",
    estimatedDuration: "2 hours plus practice",
    difficulty: "Foundation",
    recommendedFor: "Employees whose work accuracy, completeness, or reliability needs improvement.",
    summary: "A course path for improving output quality through better review habits, error prevention, and consistency checks.",
    whyItMatters: "Quality of work affects trust, rework, and overall reliability. A strong process for checking output improves both performance and credibility.",
    learningObjectives: [
      "Understand what quality failures look like in daily work.",
      "Use review routines to reduce avoidable errors.",
      "Improve completeness and reliability before submission."
    ],
    modules: [
      {
        title: "Module 1: Define quality expectations",
        objective: "Clarify what accurate, complete, and reliable work means for the role.",
        lessons: [
          "Review the standards expected for normal submissions.",
          "Identify common mistakes and their impact.",
          "Understand what 'complete' really means in context."
        ],
        practiceTask: "List three common quality errors in your work area.",
        checkpoint: "The employee understands what poor quality looks like in practice."
      },
      {
        title: "Module 2: Build a review habit",
        objective: "Create a repeatable quality-check routine before submission.",
        lessons: [
          "Use a first-pass completeness review.",
          "Use a second-pass accuracy review for important tasks.",
          "Check against the original request or requirement."
        ],
        practiceTask: "Create a personal pre-submission checklist.",
        checkpoint: "The employee uses an explicit review process."
      },
      {
        title: "Module 3: Reduce recurring defects",
        objective: "Stop repeating the same avoidable mistakes.",
        lessons: [
          "Track which errors appear repeatedly.",
          "Identify whether the cause is speed, misunderstanding, or carelessness.",
          "Change the work routine to block repeat errors."
        ],
        practiceTask: "Review two recent mistakes and write how they can be prevented next time.",
        checkpoint: "The employee can explain how recurring defects will be reduced."
      }
    ],
    finalAssignment: "Submit a quality-improvement checklist and a short defect-prevention reflection.",
    successIndicators: [
      "Has a visible review routine.",
      "Understands common error patterns.",
      "Shows fewer avoidable defects in later work."
    ],
    managerFollowUp: "Review later submissions for evidence that the checklist is being used consistently."
  }),
  "kpi-communication-workplace-communication-guide": createLearningPath({
    id: "kpi-communication-workplace-communication-guide",
    title: "Workplace communication pathway",
    format: "Mini course",
    targetArea: "Communication",
    estimatedDuration: "2 hours plus practice",
    difficulty: "Foundation",
    recommendedFor: "Employees whose updates, responses, or collaboration communication need improvement.",
    summary: "A communication course focused on clarity, response quality, updates, and collaboration habits in the workplace.",
    whyItMatters: "Communication problems slow work, create misunderstandings, and weaken collaboration even when technical ability is strong.",
    learningObjectives: [
      "Write and speak with more clarity and context.",
      "Improve work updates and follow-up communication.",
      "Reduce ambiguity during collaboration."
    ],
    modules: [
      {
        title: "Module 1: Clarify the message",
        objective: "Learn how to make updates and responses easier to understand.",
        lessons: [
          "Put the key point first.",
          "Add only the context needed for understanding.",
          "Avoid vague language when requesting or reporting work."
        ],
        practiceTask: "Rewrite one unclear work message into a clearer version.",
        checkpoint: "The employee can structure a clearer workplace message."
      },
      {
        title: "Module 2: Improve follow-up and responsiveness",
        objective: "Communicate progress and next steps more reliably.",
        lessons: [
          "Use timely updates rather than silent delay.",
          "Confirm action items and deadlines explicitly.",
          "Respond with enough information to reduce back-and-forth."
        ],
        practiceTask: "Draft a project update with progress, blocker, and next step.",
        checkpoint: "The employee gives more complete progress updates."
      },
      {
        title: "Module 3: Strengthen collaboration communication",
        objective: "Support smoother teamwork through better coordination language.",
        lessons: [
          "Use communication that helps others act quickly.",
          "Document meeting outcomes clearly.",
          "Reduce misunderstanding in handoffs or shared tasks."
        ],
        practiceTask: "Summarize one meeting into action items and responsible owners.",
        checkpoint: "The employee communicates in a way that improves teamwork."
      }
    ],
    finalAssignment: "Submit three examples of improved communication: a progress update, a request, and a meeting summary.",
    successIndicators: [
      "Messages become clearer and less ambiguous.",
      "Updates include next steps and timelines.",
      "Collaboration becomes easier for others."
    ],
    managerFollowUp: "Review one real communication example and give feedback on clarity and usefulness."
  }),
  "kpi-initiative-proactive-problem-solving-workbook": createLearningPath({
    id: "kpi-initiative-proactive-problem-solving-workbook",
    title: "Initiative and problem-solving pathway",
    format: "Mini course",
    targetArea: "Initiative",
    estimatedDuration: "2 hours plus guided practice",
    difficulty: "Intermediate",
    recommendedFor: "Employees who complete assigned work but rarely act proactively or solve problems early.",
    summary: "A development path that trains employees to notice issues early, suggest solutions, and take responsible initiative.",
    whyItMatters: "Initiative is a major sign of ownership and growth potential. Improving it helps employees move beyond passive task completion.",
    learningObjectives: [
      "Spot problems earlier in the workflow.",
      "Generate practical solutions instead of waiting passively.",
      "Take responsible action with appropriate judgment."
    ],
    modules: [
      {
        title: "Module 1: Recognize opportunities for initiative",
        objective: "Identify situations where proactive action is useful and appropriate.",
        lessons: [
          "Review where issues usually appear in your work process.",
          "Learn to notice warning signs before they become larger problems.",
          "Understand when to act independently and when to escalate."
        ],
        practiceTask: "List two recurring issues that could be noticed earlier.",
        checkpoint: "The employee can identify real opportunities for initiative."
      },
      {
        title: "Module 2: Generate solution options",
        objective: "Move from noticing issues to thinking through possible responses.",
        lessons: [
          "Define the issue clearly before solving it.",
          "Generate at least two possible actions.",
          "Compare low-risk and higher-impact options."
        ],
        practiceTask: "Write two solution options for one recurring issue.",
        checkpoint: "The employee can propose responses instead of only describing the problem."
      },
      {
        title: "Module 3: Take responsible action",
        objective: "Practice acting with initiative while staying aligned with team expectations.",
        lessons: [
          "Choose the right first step.",
          "Communicate the action taken or proposed clearly.",
          "Reflect on the result and what would improve next time."
        ],
        practiceTask: "Take one documented proactive action and reflect on the outcome.",
        checkpoint: "The employee demonstrates responsible proactive behavior."
      }
    ],
    finalAssignment: "Submit one initiative case note showing the issue, proposed options, chosen action, and result.",
    successIndicators: [
      "Identifies issues earlier.",
      "Proposes realistic actions.",
      "Acts with better ownership and judgment."
    ],
    managerFollowUp: "Review one proactive case example and coach the employee on decision quality."
  }),
  "kpi-target-achievement-goal-execution-planner": createLearningPath({
    id: "kpi-target-achievement-goal-execution-planner",
    title: "Target achievement pathway",
    format: "Mini course",
    targetArea: "Target Achievement",
    estimatedDuration: "90 minutes plus follow-up",
    difficulty: "Foundation",
    recommendedFor: "Employees who struggle to consistently meet assigned goals or deadlines.",
    summary: "A practical course on breaking targets into milestones, tracking execution, and improving goal completion discipline.",
    whyItMatters: "Employees meet targets more consistently when goals are translated into milestones, review routines, and visible progress tracking.",
    learningObjectives: [
      "Break large goals into smaller milestones.",
      "Track progress in a practical weekly rhythm.",
      "Respond early when execution falls behind."
    ],
    modules: [
      {
        title: "Module 1: Translate targets into milestones",
        objective: "Turn broad targets into specific actions and checkpoints.",
        lessons: [
          "Clarify the target outcome and deadline.",
          "Break the goal into manageable stages.",
          "Assign evidence for each milestone."
        ],
        practiceTask: "Break one current target into three milestones.",
        checkpoint: "The target is converted into a practical execution plan."
      },
      {
        title: "Module 2: Track execution visibly",
        objective: "Use simple tracking to avoid losing sight of progress.",
        lessons: [
          "Create a visible weekly review method.",
          "Compare planned progress with actual completion.",
          "Identify slippage early."
        ],
        practiceTask: "Set up a weekly milestone tracker for one active target.",
        checkpoint: "The employee has a repeatable way to track progress."
      },
      {
        title: "Module 3: Recover when progress slips",
        objective: "Adjust execution before a missed target becomes final.",
        lessons: [
          "Recognize signs that completion is at risk.",
          "Decide what to reprioritize, escalate, or simplify.",
          "Communicate risk early instead of waiting until failure."
        ],
        practiceTask: "Write a recovery action for one delayed milestone.",
        checkpoint: "The employee can respond early when target progress weakens."
      }
    ],
    finalAssignment: "Submit one target-execution planner with milestones, weekly tracking, and one risk-response action.",
    successIndicators: [
      "Goals are broken down clearly.",
      "Progress is reviewed consistently.",
      "Execution risks are communicated early."
    ],
    managerFollowUp: "Review the execution planner during the next one-on-one and confirm milestone realism."
  })
};

export function getResourceDocument(resourceId: string) {
  return resourceLibrary[resourceId] ?? null;
}

export function getResourceModuleCount(resourceId: string) {
  return resourceLibrary[resourceId]?.modules.length ?? 0;
}

export function getResourceCompletionPercentage(resourceId: string, completedModuleIndexes: number[]) {
  const totalModules = getResourceModuleCount(resourceId);

  if (totalModules === 0) {
    return 0;
  }

  const completed = new Set(completedModuleIndexes).size;
  return Math.round((completed / totalModules) * 100);
}

export function getResourceExternalLinks(resourceId: string): ExternalLearningLink[] {
  const resource = resourceLibrary[resourceId];

  if (!resource) {
    return [];
  }

  const target = resource.targetArea.toLowerCase();

  if (target.includes("communication")) {
    return [
      {
        title: "Effective Workplace Communication",
        provider: "Coursera",
        url: "https://www.coursera.org/search?query=workplace%20communication",
        type: "course"
      },
      {
        title: "Business Communication Skills",
        provider: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning/search?keywords=business%20communication",
        type: "course"
      }
    ];
  }

  if (target.includes("productivity") || target.includes("target")) {
    return [
      {
        title: "Time Management Fundamentals",
        provider: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning/search?keywords=time%20management",
        type: "course"
      },
      {
        title: "Personal Productivity and Time Management",
        provider: "Coursera",
        url: "https://www.coursera.org/search?query=productivity%20time%20management",
        type: "course"
      }
    ];
  }

  if (target.includes("quality")) {
    return [
      {
        title: "Quality Management Basics",
        provider: "Alison",
        url: "https://alison.com/courses?query=quality%20management",
        type: "course"
      },
      {
        title: "Process Improvement Foundations",
        provider: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning/search?keywords=process%20improvement",
        type: "course"
      }
    ];
  }

  if (target.includes("leadership") || target.includes("career")) {
    return [
      {
        title: "Leadership Principles",
        provider: "Coursera",
        url: "https://www.coursera.org/search?query=leadership",
        type: "course"
      },
      {
        title: "Becoming a Manager",
        provider: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning/search?keywords=becoming%20a%20manager",
        type: "course"
      }
    ];
  }

  if (target.includes("initiative") || target.includes("problem")) {
    return [
      {
        title: "Creative Problem Solving",
        provider: "Coursera",
        url: "https://www.coursera.org/search?query=problem%20solving",
        type: "course"
      },
      {
        title: "Critical Thinking",
        provider: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning/search?keywords=critical%20thinking",
        type: "course"
      }
    ];
  }

  return [
    {
      title: "Professional Development Library",
      provider: "Coursera",
      url: "https://www.coursera.org/search?query=professional%20development",
      type: "course"
    },
    {
      title: "Workplace Skills Collection",
      provider: "LinkedIn Learning",
      url: "https://www.linkedin.com/learning/search?keywords=workplace%20skills",
      type: "course"
    }
  ];
}

export function getResourceGoalCards(resourceId: string): PathwayGoalCard[] {
  const resource = resourceLibrary[resourceId];

  if (!resource) {
    return [];
  }

  const cards: PathwayGoalCard[] = [];

  if (resource.learningObjectives[0]) {
    cards.push({
      title: "Primary growth target",
      detail: resource.learningObjectives[0]
    });
  }

  if (resource.learningObjectives[1]) {
    cards.push({
      title: "Applied capability",
      detail: resource.learningObjectives[1]
    });
  }

  cards.push({
    title: "Visible success evidence",
    detail: resource.successIndicators[0] ?? "Show practical evidence that performance has improved."
  });

  return cards;
}

export function getResourceMilestones(resourceId: string): PathwayMilestone[] {
  const resource = resourceLibrary[resourceId];

  if (!resource) {
    return [];
  }

  return [
    {
      title: "Stage 1: Understand the gap",
      description: resource.learningObjectives[0] ?? resource.whyItMatters
    },
    {
      title: "Stage 2: Complete guided modules",
      description: `Work through ${resource.modules.length} modules and submit practical evidence for each one.`
    },
    {
      title: "Stage 3: Prove application",
      description: resource.finalAssignment
    },
    {
      title: "Stage 4: Close the loop with HR",
      description: resource.managerFollowUp
    }
  ];
}
