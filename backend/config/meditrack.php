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
    'symptom_categories' => [
        'fever' => ['label' => 'Fever or feeling hot', 'questions' => [
            ['key' => 'temperature_measured', 'label' => 'Have you measured your temperature?', 'type' => 'choice', 'options' => ['Yes', 'No', 'Not sure']],
            ['key' => 'other_symptoms', 'label' => 'What other symptoms have you noticed?', 'type' => 'text'],
        ]],
        'respiratory' => ['label' => 'Cough or breathing concern', 'questions' => [
            ['key' => 'main_concern', 'label' => 'Which best describes your concern?', 'type' => 'choice', 'options' => ['Cough', 'Breathing concern', 'Both', 'Not sure']],
            ['key' => 'other_symptoms', 'label' => 'What else would you like the health worker to know?', 'type' => 'text'],
        ]],
        'stomach' => ['label' => 'Stomach or digestion concern', 'questions' => [
            ['key' => 'main_concern', 'label' => 'Which best describes your concern?', 'type' => 'choice', 'options' => ['Stomach discomfort', 'Vomiting', 'Loose stools', 'Other']],
            ['key' => 'other_symptoms', 'label' => 'What else would you like the health worker to know?', 'type' => 'text'],
        ]],
        'pain' => ['label' => 'Pain or discomfort', 'questions' => [
            ['key' => 'location', 'label' => 'Where do you feel the pain or discomfort?', 'type' => 'text'],
            ['key' => 'pattern', 'label' => 'Is it constant or does it come and go?', 'type' => 'choice', 'options' => ['Constant', 'Comes and goes', 'Not sure']],
        ]],
        'skin' => ['label' => 'Skin concern', 'questions' => [
            ['key' => 'main_concern', 'label' => 'Which best describes your concern?', 'type' => 'choice', 'options' => ['Rash', 'Itching', 'Swelling', 'Other']],
            ['key' => 'location', 'label' => 'Where on your body is it?', 'type' => 'text'],
        ]],
        'other' => ['label' => 'Other concern', 'questions' => [
            ['key' => 'description', 'label' => 'Please describe what you are feeling.', 'type' => 'text'],
        ]],
    ],
];
