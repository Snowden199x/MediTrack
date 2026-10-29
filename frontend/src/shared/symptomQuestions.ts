/**
 * Symptom questions shared by the resident chat and the admin "Symptom reports" page.
 *
 * Everything a resident is asked lives here, so you can add or reword a
 * question once and both screens stay in step. The keys and options must match
 * backend/config/meditrack.php — the API checks every answer against that
 * config before it saves a report.
 *
 * "Other" uses `branches`: after the resident picks one kind of feeling, the
 * chat asks one more question that fits that kind before the common questions.
 */

export type ConcernKey =
  | 'fever'
  | 'cough'
  | 'headache'
  | 'stomach'
  | 'skin'
  | 'body_pain'
  | 'breathing'
  | 'other'

export interface FollowUpBranch {
  /** Show these questions only when the parent answer equals this value. */
  when: string
  questions: FollowUpQuestion[]
}

export interface FollowUpQuestion {
  /** Stored as the answer key on the report. */
  key: string
  question: string
  options: string[]
  branches?: FollowUpBranch[]
}

export interface ConcernGuidance {
  title: string
  tips: string[]
  /** Completes the sentence "Get help right away if …". */
  seekHelp: string
  /** Replaces the normal tips when the report is urgent. */
  urgentTips?: string[]
}

export interface Concern {
  key: ConcernKey
  label: string
  /** Shown under the concern chips to help the resident choose. */
  hint: string
  followUps: FollowUpQuestion[]
  /** General self-care and when-to-get-help guidance, not a diagnosis. */
  guidance: ConcernGuidance
  /** Breathing trouble shows the urgent notice as soon as it is chosen. */
  urgent?: boolean
}

export const QUESTIONNAIRE_NOTE =
  'These questions help the health team understand your concern. They do not identify a disease.'

/** The main concern choices, in the order the resident sees them. */
export const CONCERNS: Concern[] = [
  {
    key: 'fever',
    label: 'Fever',
    hint: 'Feeling hot or having a high temperature',
    followUps: [
      {
        key: 'chills_or_aches',
        question: 'Do you also have chills or body aches?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'temperature_measured',
        question: 'Have you measured your temperature?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Rest and drink water or soup often.',
        'Wear light clothes and keep the room cool.',
        'Check your temperature again later and write it down.',
      ],
      seekHelp: 'the fever is very high, does not go down, or you feel confused or very weak.',
    },
  },
  {
    key: 'cough',
    label: 'Cough or colds',
    hint: 'Coughing, sneezing, or a runny nose',
    followUps: [
      {
        key: 'sore_throat',
        question: 'Do you also have a sore throat?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'breathing_trouble',
        question: 'Are you having trouble breathing?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Rest and drink warm water or soup.',
        'Stay away from smoke and dusty air.',
        'Sleep with your head slightly raised if coughing keeps you awake.',
      ],
      seekHelp: 'breathing becomes hard, you have chest pain, or you cannot speak a full sentence.',
    },
  },
  {
    key: 'headache',
    label: 'Headache',
    hint: 'Pain or pressure in your head',
    followUps: [
      {
        key: 'sudden_headache',
        question: 'Did the headache start suddenly?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'light_or_noise',
        question: 'Is light or noise bothering you?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Rest in a quiet, dim room.',
        'Drink water and eat something if you have not eaten.',
        'Place a cool cloth on your forehead.',
      ],
      seekHelp: 'the headache is sudden and very strong, or comes with weakness, trouble speaking, or vomiting.',
    },
  },
  {
    key: 'stomach',
    label: 'Stomach pain or diarrhea',
    hint: 'Belly pain, vomiting, or loose stools',
    followUps: [
      {
        key: 'keep_fluids',
        question: 'Can you keep food or water down?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'loose_stools',
        question: 'Have you had loose stools?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Take small sips of water or oral rehydration solution.',
        'Eat bland food like rice or soup when you can.',
        'Avoid oily, spicy, or very sweet food for now.',
      ],
      seekHelp: 'you cannot keep any water down, see blood, or feel very weak or dizzy.',
    },
  },
  {
    key: 'skin',
    label: 'Skin rash',
    hint: 'Spots, redness, swelling, or itching',
    followUps: [
      {
        key: 'itchy_rash',
        question: 'Is the rash itchy?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'new_product',
        question: 'Did it start after a new food, soap, or medicine?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Keep the area clean and dry.',
        'Do not scratch; a cool cloth can ease itching.',
        'Stop using any new soap, lotion, or food you think caused it.',
      ],
      seekHelp: 'the rash spreads quickly, or you have swelling of the face or lips or trouble breathing.',
    },
  },
  {
    key: 'body_pain',
    label: 'Body pain',
    hint: 'Aching muscles or joints',
    followUps: [
      {
        key: 'pain_area',
        question: 'Is the pain in one spot or all over?',
        options: ['One spot', 'All over', 'Not sure'],
      },
      {
        key: 'daily_activity',
        question: 'Can you still do your usual daily activities?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What can help while you wait',
      tips: [
        'Rest the sore area and avoid heavy lifting.',
        'A warm compress can ease stiffness.',
        'Move gently when you can so you do not get stiff.',
      ],
      seekHelp: 'the pain is very strong, you cannot move the area, or it comes with fever.',
    },
  },
  {
    key: 'breathing',
    label: 'Difficulty breathing',
    hint: 'Shortness of breath or hard to breathe',
    urgent: true,
    followUps: [
      {
        key: 'breathing_at_rest',
        question: 'Is it hard to breathe even while resting?',
        options: ['Yes', 'No', 'Not sure'],
      },
      {
        key: 'breathing_sudden',
        question: 'Did it start suddenly?',
        options: ['Yes', 'No', 'Not sure'],
      },
    ],
    guidance: {
      title: 'Get help now',
      tips: [
        'Sit upright and stay calm.',
        'Ask someone to stay with you and call for help if you need it.',
        'Do not wait for a reply from the health team.',
      ],
      urgentTips: [
        'Sit upright and stay calm.',
        'Ask someone to stay with you and call for help if you need it.',
        'Do not wait for a reply from the health team.',
      ],
      seekHelp: 'you have trouble breathing.',
    },
  },
  {
    key: 'other',
    label: 'Other',
    hint: 'Something else that is bothering you',
    followUps: [
      {
        key: 'other_kind',
        question: 'Which best matches how you feel?',
        options: ['Pain', 'Tiredness', 'Dizziness', 'Sleep or appetite change', 'Something else', 'Not sure'],
        // One extra question helps the resident say what kind of "other" it is.
        branches: [
          {
            when: 'Pain',
            questions: [{
              key: 'other_pain_area',
              question: 'Where do you feel the pain?',
              options: ['Head', 'Chest', 'Stomach', 'Back', 'Arms or legs', 'All over'],
            }],
          },
          {
            when: 'Tiredness',
            questions: [{
              key: 'other_tired_level',
              question: 'How much is the tiredness affecting your day?',
              options: ['A little', 'A lot', 'I cannot do my usual day', 'Not sure'],
            }],
          },
          {
            when: 'Dizziness',
            questions: [{
              key: 'other_dizzy_when',
              question: 'When does the dizziness happen?',
              options: ['When standing up', 'All the time', 'Now and then', 'Not sure'],
            }],
          },
          {
            when: 'Sleep or appetite change',
            questions: [{
              key: 'other_sleep_appetite',
              question: 'What changed for you?',
              options: ['Hard to sleep', 'Eating less', 'Eating more', 'No appetite', 'Not sure'],
            }],
          },
          {
            when: 'Something else',
            questions: [{
              key: 'other_where',
              question: 'Where do you feel it most?',
              options: ['Head', 'Chest', 'Stomach', 'Arms or legs', 'All over', 'Not sure'],
            }],
          },
          {
            when: 'Not sure',
            questions: [{
              key: 'other_closest',
              question: 'Which is closest to how you feel?',
              options: ['Pain', 'Tiredness', 'Dizziness', 'Sleep or appetite', 'Something else'],
            }],
          },
        ],
      },
      {
        key: 'other_impact',
        question: 'Does it stop you from doing your usual day?',
        options: ['Not at all', 'A little', 'A lot', 'I cannot do my usual day'],
      },
      {
        key: 'other_trend',
        question: 'Is it getting better, worse, or staying the same?',
        options: ['Better', 'Worse', 'The same', 'Not sure'],
      },
    ],
    guidance: {
      title: 'What you can do now',
      tips: [
        'Rest and drink water.',
        'Write down when you feel it and what makes it better or worse.',
        'The health team will review your report.',
      ],
      seekHelp: 'you feel worse or are worried.',
    },
  },
]

export const CONCERNS_BY_KEY = Object.fromEntries(
  CONCERNS.map(concern => [concern.key, concern]),
) as Record<ConcernKey, Concern>

export interface StartOption {
  value: string
  label: string
  /** Used to work out the date that is saved with the report. */
  daysAgo: number
}

/** "When did it start?" choices. “Pick a date” is added by the chat itself. */
export const START_OPTIONS: StartOption[] = [
  { value: 'today', label: 'Today', daysAgo: 0 },
  { value: 'yesterday', label: 'Yesterday', daysAgo: 1 },
  { value: '2_3_days', label: '2–3 days ago', daysAgo: 2 },
  { value: 'about_a_week', label: 'About a week ago', daysAgo: 6 },
  { value: 'over_a_week', label: 'More than a week ago', daysAgo: 10 },
]

export type SeverityValue = 'mild' | 'moderate' | 'severe' | 'unsure'

export interface SeverityOption {
  value: SeverityValue
  label: string
  hint: string
}

/** "How does it feel?" choices. */
export const SEVERITY_OPTIONS: SeverityOption[] = [
  { value: 'mild', label: 'Mild', hint: 'I notice it, but I can still do my usual day.' },
  { value: 'moderate', label: 'Moderate', hint: 'It gets in the way of some of my day.' },
  { value: 'severe', label: 'Severe', hint: 'It is very hard to do my usual day.' },
  { value: 'unsure', label: 'Not sure', hint: 'I do not know how to describe it.' },
]

/** Safety messages. No disease names and no diagnosis anywhere. */
export const URGENT_TITLE = 'Please get help right away'
export const URGENT_NOTICE =
  'Go to the health center now, or call local emergency services. If you are having trouble breathing, do not wait for a reply from the health team.'

/** Used for a severe report when the concern has no special urgent tips. */
const DEFAULT_URGENT_TIPS = [
  'Sit or lie down somewhere safe.',
  'Ask someone to stay with you if you can.',
  'Do not wait for a reply from the health team.',
]

const DEFAULT_GUIDANCE: ConcernGuidance = {
  title: 'What you can do now',
  tips: [
    'Rest and drink water.',
    'Keep track of how you feel.',
    'The health team will review your report.',
  ],
  seekHelp: 'you feel worse or are worried.',
}

/** The "Other" concern uses the first answer to pick more focused guidance. */
export const OTHER_GUIDANCE: Record<string, ConcernGuidance> = {
  Pain: {
    title: 'What can help with the pain',
    tips: [
      'Rest the area that hurts.',
      'Avoid heavy lifting or long standing.',
      'A warm or cool compress may help.',
    ],
    seekHelp: 'the pain is in your chest, is very strong, or you cannot move normally.',
  },
  Tiredness: {
    title: 'What can help with tiredness',
    tips: [
      'Rest and try to sleep at regular times.',
      'Eat regular meals and drink water.',
      'Write down when the tiredness is worst.',
    ],
    seekHelp: 'the tiredness lasts more than a few days or stops you from doing your usual day.',
  },
  Dizziness: {
    title: 'What can help with dizziness',
    tips: [
      'Sit or lie down when it starts.',
      'Stand up slowly.',
      'Drink water.',
    ],
    seekHelp: 'you faint, fall, or the dizziness happens often.',
  },
  'Sleep or appetite change': {
    title: 'What can help with sleep and appetite',
    tips: [
      'Keep a regular sleep time and avoid screens late.',
      'Eat small meals at regular times.',
      'Avoid coffee or strong tea in the afternoon.',
    ],
    seekHelp: 'you lose weight without trying, or cannot sleep for several nights.',
  },
  'Something else': {
    title: 'What you can do now',
    tips: [
      'Write down when it happens and what makes it better or worse.',
      'Rest and drink water.',
      'Keep these notes ready for the health worker.',
    ],
    seekHelp: 'it gets worse quickly or you feel very unwell.',
  },
  'Not sure': {
    title: 'What you can do now',
    tips: [
      'Keep track of how you feel today.',
      'Rest, eat, and drink water.',
      'The health team will review your report and may contact you.',
    ],
    seekHelp: 'you feel worse or are worried.',
  },
}

/** True when the resident's own report should show the urgent notice. */
export function isUrgentReport(concern: string | null, severity: string | null): boolean {
  return concern === 'breathing' || severity === 'severe'
}

export interface Recommendation extends ConcernGuidance {
  urgent: boolean
}

/**
 * General guidance for the "what to do now" card after sending.
 * It never names a disease. Health staff should approve this wording.
 */
export function recommendationFor(
  concernKey: string | null,
  severity: string | null,
  answers: Record<string, string>,
): Recommendation {
  const urgent = isUrgentReport(concernKey, severity)
  const concern = concernKey && concernKey in CONCERNS_BY_KEY
    ? CONCERNS_BY_KEY[concernKey as ConcernKey]
    : null

  let guidance = concern?.guidance ?? DEFAULT_GUIDANCE
  if (concernKey === 'other') {
    guidance = OTHER_GUIDANCE[answers.other_kind] ?? OTHER_GUIDANCE['Not sure']
  }

  const tips = urgent
    ? [...(guidance.urgentTips ?? DEFAULT_URGENT_TIPS)]
    : [...guidance.tips]

  if (!urgent && concernKey === 'other') {
    const needsToday =
      answers.other_impact === 'A lot' ||
      answers.other_impact === 'I cannot do my usual day' ||
      answers.other_trend === 'Worse'

    if (needsToday) {
      tips.push('Because this is affecting your day or getting worse, contact the health center today.')
    }
  }

  return { ...guidance, tips, urgent }
}
