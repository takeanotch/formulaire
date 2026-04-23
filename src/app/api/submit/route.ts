// app/api/submit/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const headersList = await headers()
    
    const {
      cpuCores,
      ram,
      storageSpace,
      storageType,
      architecture,
      virtualization,
      compatible,
      fingerprint
    } = body

    // Validation
    if (!cpuCores || !ram || !storageSpace || !storageType || !architecture || virtualization === undefined || !fingerprint) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
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
        { error: 'Vous avez déjà soumis une réponse' },
        { status: 409 }
      )
    }

    // Récupérer l'IP
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      'unknown'

    // Insérer la nouvelle réponse SANS user_agent
    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        cpu_cores: cpuCores,
        ram: ram,
        storage_space: storageSpace,
        storage_type: storageType,
        architecture: architecture,
        virtualization: virtualization,
        compatible: compatible,
        fingerprint: fingerprint,
        ip_address: ipAddress
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { 
        id: data.id,
        compatible: data.compatible
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}