// import { NextRequest, NextResponse } from 'next/server'
// import { supabase } from '@/lib/supabase'

// export async function POST(request: NextRequest) {
//   try {
//     const { fingerprint } = await request.json()
//     const ip = request.headers.get('x-forwarded-for') || 
//                request.headers.get('x-real-ip') || 
//                'unknown'

//     // Check by fingerprint
//     const { data: byFingerprint } = await supabase
//       .from('survey_responses')
//       .select('id')
//       .eq('fingerprint', fingerprint)
//       .single()

//     if (byFingerprint) {
//       return NextResponse.json({ submitted: true })
//     }

//     // Check by IP in last 24h
//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
//     const { data: byIp } = await supabase
//       .from('survey_responses')
//       .select('id')
//       .eq('ip_address', ip)
//       .gte('created_at', twentyFourHoursAgo.toISOString())
//       .single()

//     if (byIp) {
//       return NextResponse.json({ submitted: true })
//     }

//     return NextResponse.json({ submitted: false })
//   } catch (error) {
//     return NextResponse.json({ submitted: false })
//   }
// }

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    
    // Récupération de l'IP réelle
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') || 
               'unknown'

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // 1. Vérification par fingerprint (même navigateur)
    if (fingerprint && fingerprint !== 'unknown') {
      const { data: byFingerprint } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('fingerprint', fingerprint)
        .single()

      if (byFingerprint) {
        return NextResponse.json({ submitted: true })
      }
    }

    // 2. Vérification par IP (dernières 24h)
    const { data: byIp } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .single()

    if (byIp) {
      return NextResponse.json({ submitted: true })
    }

    // 3. Vérification par sous-réseau IP (même réseau local, même si IP change légèrement)
    const ipParts = ip.split('.')
    if (ipParts.length === 4 && ip !== 'unknown') {
      const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`
      
      const { data: bySubnet } = await supabase
        .from('survey_responses')
        .select('id')
        .like('ip_address', `${subnet}%`)
        .gte('created_at', oneHourAgo.toISOString())
        .single()

      if (bySubnet) {
        return NextResponse.json({ submitted: true })
      }
    }

    // 4. Vérification par IP + délai court (anti contournement rapide)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const { data: recentByIp } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .single()

    if (recentByIp) {
      return NextResponse.json({ submitted: true })
    }

    return NextResponse.json({ submitted: false })

  } catch (error) {
    console.error('Error checking submission:', error)
    return NextResponse.json({ submitted: false })
  }
}