import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { category, topic, difficulty_level, user_id } = await req.json()

    if (!category || !topic) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: category, topic" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retrieve environment variables
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openAiKey) throw new Error("Missing OPENAI_API_KEY")
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase configuration")

    // Define strict JSON structure for the LLM
    const systemPrompt = `You are an expert teacher. Generate educational content based on the user's category, topic, and difficulty level. 
You must respond with a strict JSON object exactly matching this structure:
{
  "summary": "A concise explanation of the topic.",
  "flashcards": [
    { "front_text": "...", "back_text": "..." }
  ],
  "mcq": [
    { 
      "question_text": "...", 
      "options": ["A", "B", "C", "D"], 
      "correct_answer": "A" 
    }
  ]
}
Ensure there are exactly 5 flashcards and 5 mcq objects. Do not include markdown blocks or any other text outside the JSON object.`

    // Request from OpenAI
    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Category: ${category}\nTopic: ${topic}\nDifficulty: ${difficulty_level || 'Intermediate'}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      throw new Error(`OpenAI Error: ${errorData}`);
    }

    const aiData = await openAiResponse.json();
    const content = JSON.parse(aiData.choices[0].message.content);

    // Initialize Supabase Client with Service Role Key
    // Service Role bypasses RLS policies to execute these backend insertions safely
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Insert Lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        category,
        topic,
        difficulty_level,
        user_id: user_id || null, // null handles guest sessions gracefully
        summary_text: content.summary
      })
      .select('id')
      .single()

    if (lessonError) throw new Error(`Lesson Insert Error: ${lessonError.message}`)

    const lessonId = lesson.id

    // 2. Insert Flashcards
    const flashcardsData = content.flashcards.map((fc: any) => ({
      lesson_id: lessonId,
      front_text: fc.front_text,
      back_text: fc.back_text
    }));

    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .insert(flashcardsData)

    if (flashcardsError) throw new Error(`Flashcards Insert Error: ${flashcardsError.message}`)

    // 3. Insert MCQs
    const mcqData = content.mcq.map((q: any) => ({
      lesson_id: lessonId,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { error: mcqError } = await supabase
      .from('mcq_questions')
      .insert(mcqData)

    if (mcqError) throw new Error(`MCQ Insert Error: ${mcqError.message}`)

    // Return successful HTTP Response
    return new Response(
      JSON.stringify({ success: true, lesson_id: lessonId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
