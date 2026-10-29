<?php

return [
    'superuser' => [
        'name' => env('MEDITRACK_SUPERUSER_NAME', 'MediTrack Superuser'),
        'email' => env('MEDITRACK_SUPERUSER_EMAIL'),
        'password' => env('MEDITRACK_SUPERUSER_PASSWORD'),
    ],
    'questionnaire_version' => '1',
    'area_alerts_enabled' => env('MEDITRACK_AREA_ALERTS_ENABLED', false),
    'minimum_display_count' => 5,
    'next_step' => 'Please contact your barangay health worker or health center to discuss your report. If you need immediate help, seek local emergency assistance.',
    // Keep in sync with frontend/src/shared/symptomQuestions.ts.
    'symptom_categories' => [
        'fever' => ['label' => 'Fever', 'questions' => [
            ['key' => 'chills_or_aches', 'label' => 'Do you also have chills or body aches?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'temperature_measured', 'label' => 'Have you measured your temperature?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'cough' => ['label' => 'Cough or colds', 'questions' => [
            ['key' => 'sore_throat', 'label' => 'Do you also have a sore throat?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'breathing_trouble', 'label' => 'Are you having trouble breathing?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'headache' => ['label' => 'Headache', 'questions' => [
            ['key' => 'sudden_headache', 'label' => 'Did the headache start suddenly?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'light_or_noise', 'label' => 'Is light or noise bothering you?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'stomach' => ['label' => 'Stomach pain or diarrhea', 'questions' => [
            ['key' => 'keep_fluids', 'label' => 'Can you keep food or water down?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'loose_stools', 'label' => 'Have you had loose stools?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'skin' => ['label' => 'Skin rash', 'questions' => [
            ['key' => 'itchy_rash', 'label' => 'Is the rash itchy?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'new_product', 'label' => 'Did it start after a new food, soap, or medicine?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'body_pain' => ['label' => 'Body pain', 'questions' => [
            ['key' => 'pain_area', 'label' => 'Is the pain in one spot or all over?', 'type' => 'choice', 'options' => ['One spot', 'All over', 'Not sure']],
            ['key' => 'daily_activity', 'label' => 'Can you still do your usual daily activities?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'breathing' => ['label' => 'Difficulty breathing', 'questions' => [
            ['key' => 'breathing_at_rest', 'label' => 'Is it hard to breathe even while resting?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'breathing_sudden', 'label' => 'Did it start suddenly?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
        ]],
        'other' => ['label' => 'Other', 'questions' => [
            ['key' => 'other_kind', 'label' => 'Which best matches how you feel?', 'type' => 'choice', 'options' => ['Pain', 'Tiredness', 'Dizziness', 'Sleep or appetite change', 'Something else', 'Not sure']],
            ['key' => 'other_pain_area', 'label' => 'Where do you feel the pain?', 'type' => 'choice', 'options' => ['Head', 'Chest', 'Stomach', 'Back', 'Arms or legs', 'All over']],
            ['key' => 'other_tired_level', 'label' => 'How much is the tiredness affecting your day?', 'type' => 'choice', 'options' => ['A little', 'A lot', 'I cannot do my usual day', 'Not sure']],
            ['key' => 'other_dizzy_when', 'label' => 'When does the dizziness happen?', 'type' => 'choice', 'options' => ['When standing up', 'All the time', 'Now and then', 'Not sure']],
            ['key' => 'other_sleep_appetite', 'label' => 'What changed for you?', 'type' => 'choice', 'options' => ['Hard to sleep', 'Eating less', 'Eating more', 'No appetite', 'Not sure']],
            ['key' => 'other_where', 'label' => 'Where do you feel it most?', 'type' => 'choice', 'options' => ['Head', 'Chest', 'Stomach', 'Arms or legs', 'All over', 'Not sure']],
            ['key' => 'other_closest', 'label' => 'Which is closest to how you feel?', 'type' => 'choice', 'options' => ['Pain', 'Tiredness', 'Dizziness', 'Sleep or appetite', 'Something else']],
            ['key' => 'other_impact', 'label' => 'Does it stop you from doing your usual day?', 'type' => 'choice', 'options' => ['Not at all', 'A little', 'A lot', 'I cannot do my usual day']],
            ['key' => 'other_trend', 'label' => 'Is it getting better, worse, or staying the same?', 'type' => 'choice', 'options' => ['Better', 'Worse', 'The same', 'Not sure']],
        ]],
    ],
];
