// app/api/check-submission/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    
    // Si pas de fingerprint, on laisse passer directement
    if (!fingerprint || fingerprint === 'unknown') {
      return NextResponse.json({ submitted: false })
    }

    // Vérification simple avec le fingerprint
    const { data } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('fingerprint', fingerprint)
      .maybeSingle()

    // Si trouvé, bloquer. Sinon, laisser passer
    return NextResponse.json({ 
      submitted: data ? true : false 
    })

  } catch (error) {
    // Peu importe l'erreur, on laisse passer
    console.error('Check error:', error)
    return NextResponse.json({ submitted: false })
  }
}