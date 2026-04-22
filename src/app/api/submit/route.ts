// import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/lib/supabase'

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     const { studentName, hasComputer, computerType, fingerprint } = body

//     // Get IP address
//     const ip = request.headers.get('x-forwarded-for') || 
//                request.headers.get('x-real-ip') || 
//                'unknown'

//     // Check if already submitted by fingerprint
//     const { data: existingByFingerprint } = await supabase
//       .from('survey_responses')
//       .select('id')
//       .eq('fingerprint', fingerprint)
//       .single()

//     if (existingByFingerprint) {
//       return NextResponse.json(
//         { error: 'Already submitted' },
//         { status: 409 }
//       )
//     }

//     // Check if already submitted by IP (last 24h)
//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
//     const { data: existingByIp } = await supabase
//       .from('survey_responses')
//       .select('id')
//       .eq('ip_address', ip)
//       .gte('created_at', twentyFourHoursAgo.toISOString())
//       .single()

//     if (existingByIp) {
//       return NextResponse.json(
//         { error: 'Already submitted from this IP recently' },
//         { status: 409 }
//       )
//     }

//     // Insert new response
//     const { error } = await supabase
//       .from('survey_responses')
//       .insert({
//         student_name: studentName,
//         has_computer: hasComputer,
//         computer_type: computerType || null,
//         ip_address: ip,
//         fingerprint: fingerprint
//       })

//     if (error) throw error

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error('Submission error:', error)
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     )
//   }
// }

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Attendre que headers() soit résolu
    const headersList = await headers()
    
    const {
      studentName,
      hasComputer,
      computerType,
      planToGetComputer,
      expectedDate,
      withoutComputerPlan,
      fingerprint
    } = body

    // Validation
    if (!studentName || hasComputer === undefined || !fingerprint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Vérifier si le fingerprint existe déjà
    const { data: existing } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('fingerprint', fingerprint)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Already submitted' },
        { status: 409 }
      )
    }

    // Récupérer l'IP et l'User-Agent
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Insérer la nouvelle réponse
    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        student_name: studentName,
        has_computer: hasComputer,
        computer_type: computerType || null,
        plan_to_get_computer: planToGetComputer || null,
        expected_date: expectedDate || null,
        without_computer_plan: withoutComputerPlan || null,
        fingerprint: fingerprint,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}