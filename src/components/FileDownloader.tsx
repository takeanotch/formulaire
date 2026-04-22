'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

interface DownloadableFile {
  id: string
  name: string
  type: 'apk' | 'exe' | 'other'
  size: number
  version?: string
  description?: string
  created_at: string
  download_url: string
}

interface FileDownloaderProps {
  bucketName?: string
  folderPath?: string
  className?: string
  showDetails?: boolean
  onDownloadStart?: (file: DownloadableFile) => void
  onDownloadComplete?: (file: DownloadableFile) => void
  onError?: (error: Error) => void
}

export default function FileDownloader({
  bucketName = 'downloads',
  folderPath = '',
  className = '',
  showDetails = true,
  onDownloadStart,
  onDownloadComplete,
  onError
}: FileDownloaderProps) {
  const [files, setFiles] = useState<DownloadableFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    fetchFiles()
  }, [bucketName, folderPath])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')

      const path = folderPath ? `${folderPath}/` : ''
      
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      if (data) {
        const filePromises = data
          .filter(file => {
            const ext = file.name.split('.').pop()?.toLowerCase()
            return ext === 'apk' || ext === 'exe'
          })
          .map(async (file): Promise<DownloadableFile> => {
            const { data: { publicUrl } } = supabase
              .storage
              .from(bucketName)
              .getPublicUrl(`${path}${file.name}`)

            // Déterminer le type de fichier de manière stricte
            const fileType = file.name.endsWith('.apk') ? 'apk' as const : 
                           file.name.endsWith('.exe') ? 'exe' as const : 
                           'other' as const

            return {
              id: file.id || `${Date.now()}-${file.name}`,
              name: file.name,
              type: fileType,
              size: file.metadata?.size || 0,
              version: extractVersion(file.name),
              description: '',
              created_at: file.created_at || new Date().toISOString(),
              download_url: publicUrl
            }
          })

        const filesList = await Promise.all(filePromises)
        setFiles(filesList)
      }
    } catch (err) {
      console.error('Error fetching files:', err)
      setError('Impossible de charger les fichiers disponibles')
      onError?.(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const extractVersion = (filename: string): string | undefined => {
    const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/)
    return versionMatch ? versionMatch[1] : undefined
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadFile = async (file: DownloadableFile) => {
    try {
      setDownloading(file.id)
      setDownloadProgress(0)
      onDownloadStart?.(file)

      // Méthode 1: Téléchargement direct via fetch avec progression
      const response = await fetch(file.download_url)
      
      if (!response.ok) throw new Error('Échec du téléchargement')

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      
      const reader = response.body?.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          chunks.push(value)
          received += value.length
          
          if (total > 0) {
            setDownloadProgress((received / total) * 100)
          }
        }
      }

      // Créer le blob avec le bon typage
      const blob = new Blob(chunks as BlobPart[])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadProgress(100)
      onDownloadComplete?.(file)

      // Log du téléchargement (optionnel)
      await logDownload(file)

    } catch (err) {
      console.error('Download error:', err)
      setError('Erreur lors du téléchargement')
      onError?.(err as Error)

      // Fallback: Téléchargement direct si la méthode avec progression échoue
      try {
        window.open(file.download_url, '_blank')
      } catch (fallbackErr) {
        console.error('Fallback download failed:', fallbackErr)
      }
    } finally {
      setTimeout(() => {
        setDownloading(null)
        setDownloadProgress(0)
      }, 2000)
    }
  }

  const logDownload = async (file: DownloadableFile) => {
    try {
      // Optionnel: Logger les téléchargements dans une table Supabase
      const { error } = await supabase
        .from('download_logs')
        .insert({
          file_name: file.name,
          file_type: file.type,
          downloaded_at: new Date().toISOString(),
          user_agent: navigator.userAgent
        })

      if (error) console.warn('Failed to log download:', error)
    } catch (err) {
      console.warn('Failed to log download:', err)
    }
  }

  const getFileIcon = (type: 'apk' | 'exe' | 'other') => {
    switch (type) {
      case 'apk':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18,8c0,3.3-2.7,6-6,6s-6-2.7-6-6s2.7-6,6-6S18,4.7,18,8z M20,20c0,1.1-0.9,2-2,2H6c-1.1,0-2-0.9-2-2v-2 c0-3.3,2.7-6,6-6c1.2,0,2.3,0.4,3.2,1C14.5,13.7,16,15.7,16,18V20z"/>
          </svg>
        )
      case 'exe':
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,8h-2.8c-0.4-1.2-1.5-2-2.8-2h-2v2h2v2h-2v2h2v2h-2v2h2c1.3,0,2.4-0.8,2.8-2H20c1.1,0,2-0.9,2-2v-4 C22,8.9,21.1,8,20,8z M4,8H2v12c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2v-2h-2v2H4V8z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Chargement des fichiers...</p>
        </div>
      </div>
    )
  }

  if (error && files.length === 0) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchFiles}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500">Aucun fichier disponible pour le moment</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-">
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white 2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start space-x-3">
                {/* Icône du fichier */}
                <div className={`flex-shrink-0 ${
                  file.type === 'apk' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  <img src="/type.jpg" className='w-10'/>
                </div>

                {/* Informations du fichier */}
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {file.name}
                  </h3>
                  
                  {showDetails && (
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {formatFileSize(file.size)}
                        </span>
                        
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                          </svg>
                          {file.type.toUpperCase()}
                        </span>

                        {file.version && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            v{file.version}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton de téléchargement et progression */}
              <div className="mt-4">
                {downloading === file.id ? (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 -full"
                        initial={{ width: 0 }}
                        animate={{ width: `${downloadProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Téléchargement... {Math.round(downloadProgress)}%
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => downloadFile(file)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4  font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Télécharger</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

   
    </div>
  )
}