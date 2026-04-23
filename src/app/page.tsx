// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function Home() {
  const [formData, setFormData] = useState({
    cpuCores: '',
    ram: '',
    storageSpace: '',
    storageType: '',
    architecture: '',
    virtualization: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [checkingSubmission, setCheckingSubmission] = useState(true)

  // États pour les modals de sélection personnalisés
  const [showCpuModal, setShowCpuModal] = useState(false)
  const [showRamModal, setShowRamModal] = useState(false)
  const [showStorageSpaceModal, setShowStorageSpaceModal] = useState(false)
  const [showStorageTypeModal, setShowStorageTypeModal] = useState(false)
  const [showArchitectureModal, setShowArchitectureModal] = useState(false)

  const cpuOptions = [
    { value: '2_cores', label: '🔹 2 cœurs' },
    { value: '4_cores', label: '🔸 4 cœurs' },
    { value: '6_cores', label: '🔷 6 cœurs' },
    { value: '8_cores', label: '💎 8 cœurs' },
    { value: '8plus_cores', label: '👑 8+ cœurs' },
    { value: 'unknown', label: '❓ Je ne sais pas' }
  ]

  const ramOptions = [
    { value: '4GB', label: '📊 4 Go' },
    { value: '8GB', label: '📊 8 Go' },
    { value: '16GB', label: '📊 16 Go' },
    { value: '32GB', label: '📊 32 Go' },
    { value: '32GB_plus', label: '📊 32 Go et plus' },
    { value: 'unknown', label: '❓ Je ne sais pas' }
  ]

  const storageSpaceOptions = [
    { value: '50GB', label: '💾 50 Go' },
    { value: '100GB', label: '💾 100 Go' },
    { value: '200GB', label: '💾 200 Go' },
    { value: '200GB_plus', label: '💾 200 Go et plus' },
    { value: 'unknown', label: '❓ Je ne sais pas' }
  ]

  const storageTypeOptions = [
    { value: 'SSD', label: '⚡ SSD' },
    { value: 'HDD', label: '💿 HDD' },
    { value: 'NVMe', label: '🚀 NVMe' },
    { value: 'unknown', label: '❓ Je ne sais pas' }
  ]

  const architectureOptions = [
    { value: '64-bit', label: '🖥️ 64 bits (x64)' },
    { value: '32-bit', label: '💻 32 bits (x86)' },
    { value: 'ARM', label: '📱 ARM' },
    { value: 'unknown', label: '❓ Je ne sais pas' }
  ]

  useEffect(() => {
    checkIfAlreadySubmitted()
  }, [])

  const checkIfAlreadySubmitted = async () => {
    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      const fingerprint = result.visitorId

      const response = await fetch('/api/check-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      })

      const data = await response.json()
      
      if (data.submitted) {
        setAlreadySubmitted(true)
        localStorage.setItem('survey_submitted', 'true')
      } else {
        setAlreadySubmitted(false)
        localStorage.removeItem('survey_submitted')
      }
    } catch (error) {
      console.error('Error checking submission:', error)
      setAlreadySubmitted(false)
      localStorage.removeItem('survey_submitted')
    } finally {
      setCheckingSubmission(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      const fingerprint = result.visitorId

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpuCores: formData.cpuCores,
          ram: formData.ram,
          storageSpace: formData.storageSpace,
          storageType: formData.storageType,
          architecture: formData.architecture,
          virtualization: formData.virtualization === 'yes',
          fingerprint
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setAlreadySubmitted(true)
          localStorage.setItem('survey_submitted', 'true')
          throw new Error('Vous avez déjà soumis une réponse')
        }
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setSubmitted(true)
      localStorage.setItem('survey_submitted', 'true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Modal de sélection personnalisé
  const SelectModal = ({ isOpen, onClose, title, options, selectedValue, onSelect }: any) => {
    if (!isOpen) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {options.map((option: any) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value)
                    onClose()
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                    selectedValue === option.value
                      ? 'bg-blue-50 text-blue-600 font-medium border-2 border-blue-500'
                      : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (checkingSubmission) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-2 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Vérification en cours...</p>
        </div>
      </main>
    )
  }

  if (alreadySubmitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-[120px] mx-auto bg-white rounded-xl flex items-center justify-center">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={124} 
              height={124}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  `
                }
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Déjà soumis !</h1>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Vous avez déjà participé à ce sondage !
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Une seule participation est autorisée par machine.
          </div>
        </motion.div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center ">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-4 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Merci !</h1>
          <p className="text-gray-600 mb-4">
            Votre participation au sondage a bien été enregistrée.
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      {/* Modals de sélection */}
      <AnimatePresence>
        {showCpuModal && (
          <SelectModal
            key="cpu-modal"
            isOpen={showCpuModal}
            onClose={() => setShowCpuModal(false)}
            title="Nombre de cœurs du processeur"
            options={cpuOptions}
            selectedValue={formData.cpuCores}
            onSelect={(value: string) => setFormData({...formData, cpuCores: value})}
          />
        )}
        {showRamModal && (
          <SelectModal
            key="ram-modal"
            isOpen={showRamModal}
            onClose={() => setShowRamModal(false)}
            title="Mémoire RAM"
            options={ramOptions}
            selectedValue={formData.ram}
            onSelect={(value: string) => setFormData({...formData, ram: value})}
          />
        )}
        {showStorageSpaceModal && (
          <SelectModal
            key="storage-space-modal"
            isOpen={showStorageSpaceModal}
            onClose={() => setShowStorageSpaceModal(false)}
            title="Espace de stockage"
            options={storageSpaceOptions}
            selectedValue={formData.storageSpace}
            onSelect={(value: string) => setFormData({...formData, storageSpace: value})}
          />
        )}
        {showStorageTypeModal && (
          <SelectModal
            key="storage-type-modal"
            isOpen={showStorageTypeModal}
            onClose={() => setShowStorageTypeModal(false)}
            title="Type de stockage"
            options={storageTypeOptions}
            selectedValue={formData.storageType}
            onSelect={(value: string) => setFormData({...formData, storageType: value})}
          />
        )}
        {showArchitectureModal && (
          <SelectModal
            key="architecture-modal"
            isOpen={showArchitectureModal}
            onClose={() => setShowArchitectureModal(false)}
            title="Architecture du processeur"
            options={architectureOptions}
            selectedValue={formData.architecture}
            onSelect={(value: string) => setFormData({...formData, architecture: value})}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 relative"
      >
        {/* En-tête avec logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-[120px] bg-white rounded-xl flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={224} 
                height={224}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    `
                  }
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-blue-600 mb-2">
            Sondage Configuration Machine
          </h1>
          <p className="text-gray-600 text-lg">
            Partagez les spécifications de votre machine
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Spécifications matérielles */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 text-sm">🖥️</span>
              Spécifications de votre machine
            </h2>

            <div className="space-y-4">
              {/* CPU Cores */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de cœurs du processeur <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCpuModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.cpuCores ? (
                    <span className="text-gray-700">
                      {cpuOptions.find(c => c.value === formData.cpuCores)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez le nombre de cœurs...</span>
                  )}
                </button>
              </div>

              {/* RAM */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mémoire RAM <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRamModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.ram ? (
                    <span className="text-gray-700">
                      {ramOptions.find(r => r.value === formData.ram)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez la quantité de RAM...</span>
                  )}
                </button>
              </div>

              {/* Espace de stockage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Espace de stockage disponible <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowStorageSpaceModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.storageSpace ? (
                    <span className="text-gray-700">
                      {storageSpaceOptions.find(s => s.value === formData.storageSpace)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez l'espace disponible...</span>
                  )}
                </button>
              </div>

              {/* Type de stockage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de stockage <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowStorageTypeModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.storageType ? (
                    <span className="text-gray-700">
                      {storageTypeOptions.find(s => s.value === formData.storageType)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez le type de stockage...</span>
                  )}
                </button>
              </div>

              {/* Architecture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Architecture du processeur <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowArchitectureModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.architecture ? (
                    <span className="text-gray-700">
                      {architectureOptions.find(a => a.value === formData.architecture)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez l'architecture...</span>
                  )}
                </button>
              </div>

              {/* Virtualisation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Votre processeur supporte-t-il la virtualisation ? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                    <input
                      type="radio"
                      name="virtualization"
                      value="yes"
                      required
                      checked={formData.virtualization === 'yes'}
                      onChange={(e) => setFormData({...formData, virtualization: e.target.value})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">✅ Oui</span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                    <input
                      type="radio"
                      name="virtualization"
                      value="no"
                      checked={formData.virtualization === 'no'}
                      onChange={(e) => setFormData({...formData, virtualization: e.target.value})}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">❌ Non</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start"
            >
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              'Participer au sondage'
            )}
          </button>
        </form>
      </motion.div>
    </main>
  )
}