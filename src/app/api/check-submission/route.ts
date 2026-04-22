import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check by fingerprint
    const { data: byFingerprint } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('fingerprint', fingerprint)
      .single()

    if (byFingerprint) {
      return NextResponse.json({ submitted: true })
    }

    // Check by IP in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { data: byIp } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .single()

    if (byIp) {
      return NextResponse.json({ submitted: true })
    }

    return NextResponse.json({ submitted: false })
  } catch (error) {
    return NextResponse.json({ submitted: false })
  }
}