// 'use client'

// import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'
// import FingerprintJS from '@fingerprintjs/fingerprintjs'
// import { motion, AnimatePresence } from 'framer-motion'
// import Image from 'next/image'

// export default function Home() {
//   const [formData, setFormData] = useState({
//     studentName: '',
//     hasComputer: '',
//     computerType: '',
//     planToGetComputer: '',
//     expectedDate: '',
//     withoutComputerPlan: ''
//   })
//   const [loading, setLoading] = useState(false)
//   const [submitted, setSubmitted] = useState(false)
//   const [error, setError] = useState('')
//   const [alreadySubmitted, setAlreadySubmitted] = useState(false)
//   const [checkingSubmission, setCheckingSubmission] = useState(true)
//   const [isAdmin, setIsAdmin] = useState(false)

//   // États pour les modals de sélection personnalisés
//   const [showComputerTypeModal, setShowComputerTypeModal] = useState(false)
//   const [showExpectedDateModal, setShowExpectedDateModal] = useState(false)

//   const computerTypes = [
//     { value: 'laptop_windows', label: '💻 Portable Windows' },
//     { value: 'laptop_mac', label: '🍎 MacBook' },
//     { value: 'laptop_linux', label: '🐧 Portable Linux' },
//     { value: 'laptop_chrome', label: '🌐 Chromebook' },
//     { value: 'laptop_other', label: '📱 Autre type de portable' }
//   ]

//   const expectedDates = [
//     { value: 'this_week', label: 'Cette semaine' },
//     { value: 'next_week', label: 'La semaine prochaine' },
//     { value: 'this_month', label: 'Ce mois-ci' },
//     { value: 'next_month', label: 'Le mois prochain' },
//     { value: 'uncertain', label: 'Pas encore déterminé' }
//   ]

//   useEffect(() => {
//     checkIfAlreadySubmitted()
    
//     const adminMode = sessionStorage.getItem('admin_mode')
//     if (adminMode === 'true') {
//       setIsAdmin(true)
//     }
//   }, [])

//   const checkIfAlreadySubmitted = async () => {
//     const adminMode = sessionStorage.getItem('admin_mode')
    
//     if (adminMode !== 'true') {
//       const submitted = localStorage.getItem('survey_submitted')
//       if (submitted) {
//         console.log('LocalStorage indique soumis, vérification avec le serveur...')
//       }
//     }

//     try {
//       const fp = await FingerprintJS.load()
//       const result = await fp.get()
//       const fingerprint = result.visitorId

//       const response = await fetch('/api/check-submission', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fingerprint })
//       })

//       const data = await response.json()
      
//       if (data.submitted) {
//         setAlreadySubmitted(true)
//         localStorage.setItem('survey_submitted', 'true')
//       } else {
//         if (localStorage.getItem('survey_submitted')) {
//           localStorage.removeItem('survey_submitted')
//           console.log('LocalStorage nettoyé car entrée non trouvée en BDD')
//         }
//         setAlreadySubmitted(false)
//       }
//     } catch (error) {
//       console.error('Error checking submission:', error)
//       setAlreadySubmitted(false)
//     } finally {
//       setCheckingSubmission(false)
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       const fp = await FingerprintJS.load()
//       const result = await fp.get()
//       const fingerprint = result.visitorId

//       const response = await fetch('/api/submit', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...formData,
//           fingerprint,
//           hasComputer: formData.hasComputer === 'yes'
//         })
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         if (response.status === 409) {
//           setAlreadySubmitted(true)
//           localStorage.setItem('survey_submitted', 'true')
//           throw new Error('You have already submitted a response')
//         }
//         throw new Error(data.error || 'Something went wrong')
//       }

//       setSubmitted(true)
//       localStorage.setItem('survey_submitted', 'true')
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const resetSubmission = () => {
//     localStorage.removeItem('survey_submitted')
//     setAlreadySubmitted(false)
//     setSubmitted(false)
//     setCheckingSubmission(false)
//     setFormData({
//       studentName: '',
//       hasComputer: '',
//       computerType: '',
//       planToGetComputer: '',
//       expectedDate: '',
//       withoutComputerPlan: ''
//     })
//   }

//   const toggleAdminMode = () => {
//     const newAdminMode = !isAdmin
//     setIsAdmin(newAdminMode)
//     if (newAdminMode) {
//       sessionStorage.setItem('admin_mode', 'true')
//     } else {
//       sessionStorage.removeItem('admin_mode')
//     }
//     setCheckingSubmission(true)
//     checkIfAlreadySubmitted()
//   }

//   // Modal de sélection personnalisé
//   const SelectModal = ({ isOpen, onClose, title, options, selectedValue, onSelect }: any) => {
//     if (!isOpen) return null

//     return (
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           className="bg-white -2xl w-full max-w-md shadow-2xl"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <div className="p-6">
//             <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
//             <div className="space-y-2 max-h-96 overflow-y-auto">
//               {options.map((option: any) => (
//                 <button
//                   key={option.value}
//                   onClick={() => {
//                     onSelect(option.value)
//                     onClose()
//                   }}
//                   className={`w-full text-left px-4 py-3 -xl transition-all ${
//                     selectedValue === option.value
//                       ? 'bg-blue-50 text-blue-600 font-medium border-2 border-blue-500'
//                       : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent'
//                   }`}
//                 >
//                   {option.label}
//                 </button>
//               ))}
//             </div>
//             <button
//               onClick={onClose}
//               className="mt-4 w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
//             >
//               Annuler
//             </button>
//           </div>
//         </motion.div>
//       </motion.div>
//     )
//   }

//   if (checkingSubmission) {
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
//           <p className="mt-4 text-gray-600">Vérification en cours...</p>
//         </div>
//       </main>
//     )
//   }

//   if (alreadySubmitted) {
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white -2xl shadow-lg p-8 max-w-md w-full text-center"

//         >
//            <div className="w-[120px]mx-auto bg-white -xl flex items-center justify-center">
//               <Image 
//                 src="/logo.png" 
//                 alt="Logo" 
//                 width={124} 
//                 height={124}
//                 className="object-contain"
//                 onError={(e) => {
//                   // Fallback si le logo n'existe pas
//                   const target = e.target as HTMLImageElement
//                   target.style.display = 'none'
//                   const parent = target.parentElement
//                   if (parent) {
//                     parent.innerHTML = `
//                       <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                       </svg>
//                     `
//                   }
//                 }}
//               />
//             </div>
//           <h1 className="text-2xl font-bold text-gray-800 mb-4">Déjà soumis !</h1>
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
//             <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//             </svg>
//           </div>
//           <p className="text-gray-600 mb-6">
//             Vous avez déjà participé à ce sondage!
//           </p>
          
//           {isAdmin && (
//             <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 -xl">
//               <p className="text-sm text-yellow-800 mb-3">
//                 Mode Admin Actif - Cette soumission a été trouvée dans la base de données.
//               </p>
//               <button
//                 onClick={resetSubmission}
//                 className="w-full bg-yellow-600 text-white py-2 px-4 -lg hover:bg-yellow-700 transition-colors text-sm font-medium"
//               >
//                 Réinitialiser et tester à nouveau
//               </button>
//             </div>
//           )}
          
//           <div className="mt-4 text-sm text-gray-500">
//             Une seule réponse est autorisée par personne.
//           </div>
          
//           <button
//             onClick={toggleAdminMode}
//             className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
//             title="Mode Admin"
//           >
//             {isAdmin ? '🔓 Mode Admin' : '🔒'}
//           </button>
//         </motion.div>
//       </main>
//     )
//   }

//   if (submitted) {
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//         <motion.div
//           initial={{ scale: 0.5, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           className="bg-white -2xl shadow-lg p-8 max-w-md w-full text-center"
//         >
//           <div className="w-20 h-20 bg-green-100 -full flex items-center justify-center mx-auto mb-6">
//             <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-4">Merci !</h1>
//           <p className="text-gray-600 mb-2">
//             Votre réponse a été enregistrée avec succès.
//           </p>
          
//           {isAdmin && (
//             <div className="mt-6 p-4 bg-green-50 border border-green-200 -xl">
//               <button
//                 onClick={resetSubmission}
//                 className="w-full bg-green-600 text-white py-2 px-4 -lg hover:bg-green-700 transition-colors text-sm font-medium"
//               >
//                 Tester une nouvelle soumission
//               </button>
//             </div>
//           )}
          
//           <button
//             onClick={toggleAdminMode}
//             className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
//             title="Mode Admin"
//           >
//             {isAdmin ? '🔓 Mode Admin' : '🔒'}
//           </button>
//         </motion.div>
//       </main>
//     )
//   }

//   return (
//     <main className="min-h-screen ">
//       {/* Modals de sélection */}
//       <AnimatePresence>
//         {showComputerTypeModal && (
//           <SelectModal
//             key="computer-type-modal"
//             isOpen={showComputerTypeModal}
//             onClose={() => setShowComputerTypeModal(false)}
//             title="Type d'ordinateur portable"
//             options={computerTypes}
//             selectedValue={formData.computerType}
//             onSelect={(value: string) => setFormData({...formData, computerType: value})}
//           />
//         )}
//         {showExpectedDateModal && (
//           <SelectModal
//             key="expected-date-modal"
//             isOpen={showExpectedDateModal}
//             onClose={() => setShowExpectedDateModal(false)}
//             title="Période d'acquisition"
//             options={expectedDates}
//             selectedValue={formData.expectedDate}
//             onSelect={(value: string) => setFormData({...formData, expectedDate: value})}
//           />
//         )}
//       </AnimatePresence>

//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="max-w-4xl mx-auto bg-white -2xl  p-6 md:p-8 relative"
//       >
//         <button
//           onClick={toggleAdminMode}
//           className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
//           title="Mode Admin"
//         >
//           {isAdmin ? '🔓' : '🔒'}
//         </button>
        
//         {/* En-tête avec logo */}
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center mb-4">
//             <div className="w-[120px] bg-white -xl flex items-center justify-center">
//               <Image 
//                 src="/logo.png" 
//                 alt="Logo" 
//                 width={224} 
//                 height={224}
//                 className="object-contain"
//                 onError={(e) => {
//                   // Fallback si le logo n'existe pas
//                   const target = e.target as HTMLImageElement
//                   target.style.display = 'none'
//                   const parent = target.parentElement
//                   if (parent) {
//                     parent.innerHTML = `
//                       <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                       </svg>
//                     `
//                   }
//                 }}
//               />
//             </div>
//           </div>
//           <h1 className="text-xl md:text-4xl font-bold text-blue-600 mb-2">
//             Cours Bureautique ( Module Système d'exploitation )
//           </h1>
//           <p className="text-gray-600 text-lg">
//             Sondage sur La possession de l'ordinateur  pour les Travaux Pratiques
//           </p>
          
//           {isAdmin && (
//             <div className="mt-3 inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 -full">
//               Mode Admin Actif
//             </div>
//           )}
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* Nom de l'étudiant */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Nom complet de l'étudiant <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               required
//               value={formData.studentName}
//               onChange={(e) => setFormData({...formData, studentName: e.target.value})}
//               className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300"
//               placeholder="Ex: Jean Dupont"
//             />
//           </div>

//           {/* Avez-vous un ordinateur ? */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-3">
//               Avez-vous un ordinateur portable personnel ? <span className="text-red-500">*</span>
//             </label>
//             <div className="space-y- grid grid-cols-1 sm:grid-cols-2 gap-2">
//               <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
//                 <input
//                   type="radio"
//                   name="hasComputer"
//                   value="yes"
//                   required
//                   checked={formData.hasComputer === 'yes'}
//                   onChange={(e) => setFormData({...formData, hasComputer: e.target.value})}
//                   className="w-5 h-5 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-3 text-gray-700">Oui, j'ai un ordinateur portable</span>
//               </label>
//               <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
//                 <input
//                   type="radio"
//                   name="hasComputer"
//                   value="no"
//                   checked={formData.hasComputer === 'no'}
//                   onChange={(e) => setFormData({...formData, hasComputer: e.target.value})}
//                   className="w-5 h-5 text-blue-600 focus:ring-blue-500"
//                 />
//                 <span className="ml-3 text-gray-700">Non, je n'ai pas d'ordinateur portable</span>
//               </label>
//             </div>
//           </div>

//           {/* Si Oui - Type d'ordinateur */}
//           <AnimatePresence mode="wait">
//             {formData.hasComputer === 'yes' && (
//               <motion.div
//                 key="computer-type-section"
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 exit={{ opacity: 0, height: 0 }}
//                 transition={{ duration: 0.3 }}
//               >
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Type d'ordinateur portable <span className="text-red-500">*</span>
//                 </label>
//                 <button
//                   type="button"
//                   onClick={() => setShowComputerTypeModal(true)}
//                   className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
//                 >
//                   {formData.computerType ? (
//                     <span className="text-gray-700">
//                       {computerTypes.find(t => t.value === formData.computerType)?.label}
//                     </span>
//                   ) : (
//                     <span className="text-gray-400">Sélectionnez le type de votre portable...</span>
//                   )}
//                 </button>
//                 <p className="text-xs text-gray-500 mt-2">
//                   * Seuls les ordinateurs portables sont acceptés pour les travaux pratiques
//                 </p>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Si Non - Questions supplémentaires */}
//           <AnimatePresence mode="wait">
//             {formData.hasComputer === 'no' && (
//               <motion.div
//                 key="no-computer-section"
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 exit={{ opacity: 0, height: 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="space-y-6"
//               >
//                 {/* Question: Prévoyez-vous d'en acquérir un ? */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-3">
//                     Prévoyez-vous d'acquérir un ordinateur portable prochainement ? <span className="text-red-500">*</span>
//                   </label>
//                   <div className="space-y-3">
//                     <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
//                       <input
//                         type="radio"
//                         name="planToGetComputer"
//                         value="yes_soon"
//                         required
//                         checked={formData.planToGetComputer === 'yes_soon'}
//                         onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
//                         className="w-5 h-5 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="ml-3 text-gray-700">Oui, dans les prochains jours</span>
//                     </label>
//                     <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
//                       <input
//                         type="radio"
//                         name="planToGetComputer"
//                         value="yes_later"
//                         checked={formData.planToGetComputer === 'yes_later'}
//                         onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
//                         className="w-5 h-5 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="ml-3 text-gray-700">Oui, mais plus tard dans le semestre</span>
//                     </label>
//                     <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
//                       <input
//                         type="radio"
//                         name="planToGetComputer"
//                         value="no"
//                         checked={formData.planToGetComputer === 'no'}
//                         onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
//                         className="w-5 h-5 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="ml-3 text-gray-700">Non, je n'en prévois pas pour le moment</span>
//                     </label>
//                   </div>
//                 </div>

//                 {/* Si prévoit d'acheter - Date prévue */}
//                 <AnimatePresence mode="wait">
//                   {(formData.planToGetComputer === 'yes_soon' || formData.planToGetComputer === 'yes_later') && (
//                     <motion.div
//                       key="expected-date-section"
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: 'auto' }}
//                       exit={{ opacity: 0, height: 0 }}
//                     >
//                       <label className="block text-sm font-semibold text-gray-700 mb-2">
//                         Quand pensez-vous l'acquérir ? <span className="text-red-500">*</span>
//                       </label>
//                       <button
//                         type="button"
//                         onClick={() => setShowExpectedDateModal(true)}
//                         className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
//                       >
//                         {formData.expectedDate ? (
//                           <span className="text-gray-700">
//                             {expectedDates.find(d => d.value === formData.expectedDate)?.label}
//                           </span>
//                         ) : (
//                           <span className="text-gray-400">Sélectionnez une période...</span>
//                         )}
//                       </button>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>

//                 {/* Question: Comment allez-vous faire la pratique ? */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Comment comptez-vous effectuer les travaux pratiques sans ordinateur portable ? <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     required
//                     value={formData.withoutComputerPlan}
//                     onChange={(e) => setFormData({...formData, withoutComputerPlan: e.target.value})}
//                     className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 resize-none"
//                     placeholder="Ex: Utiliser les ordinateurs de la bibliothèque, emprunter celui d'un ami, utiliser mon téléphone..."
//                     rows={4}
//                   />
//                   <p className="text-xs text-gray-500 mt-1">
//                     Votre réponse nous aidera à mieux comprendre vos besoins
//                   </p>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Message d'erreur */}
//           {error && (
//             <motion.div
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               className="bg-red-50 border-2 border-red-200 text-red-700 p-4 -xl text-sm flex items-start"
//             >
//               <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <span>{error}</span>
//             </motion.div>
//           )}

//           {/* Bouton de soumission */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-4 px-4 -xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg text-lg"
//           >
//             {loading ? (
//               <span className="flex items-center -none justify-center">
//                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Envoi en cours...
//               </span>
//             ) : (
//               'Soumettre ma réponse'
//             )}
//           </button>
//         </form>
//       </motion.div>
//     </main>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import FileDownloader from '@/components/FileDownloader'
import ImageLink from '@/components/ImageLink';



export default function Home() {
  const [formData, setFormData] = useState({
    studentName: '',
    hasComputer: '',
    computerType: '',
    planToGetComputer: '',
    expectedDate: '',
    withoutComputerPlan: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [checkingSubmission, setCheckingSubmission] = useState(true)

  // États pour les modals de sélection personnalisés
  const [showComputerTypeModal, setShowComputerTypeModal] = useState(false)
  const [showExpectedDateModal, setShowExpectedDateModal] = useState(false)

  const computerTypes = [
    { value: 'laptop_windows', label: '💻 Portable Windows' },
    { value: 'laptop_mac', label: '🍎 MacBook' },
    { value: 'laptop_linux', label: '🐧 Portable Linux' },
    { value: 'laptop_chrome', label: '🌐 Chromebook' },
    { value: 'laptop_other', label: '📱 Autre type de portable' }
  ]

  const expectedDates = [
    { value: 'this_week', label: 'Cette semaine' },
    { value: 'next_week', label: 'La semaine prochaine' },
    { value: 'this_month', label: 'Ce mois-ci' },
    { value: 'next_month', label: 'Le mois prochain' },
    { value: 'uncertain', label: 'Pas encore déterminé' }
  ]

  useEffect(() => {
    checkIfAlreadySubmitted()
  }, [])

  const checkIfAlreadySubmitted = async () => {
    const submitted = localStorage.getItem('survey_submitted')
    if (submitted) {
      console.log('LocalStorage indique soumis, vérification avec le serveur...')
    }

    try {
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      const fingerprint = result.visitorId

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      })

      const data = await response.json()
      
      if (data.submitted) {
        setAlreadySubmitted(true)
        localStorage.setItem('survey_submitted', 'true')
      } else {
        if (localStorage.getItem('survey_submitted')) {
          localStorage.removeItem('survey_submitted')
          console.log('LocalStorage nettoyé car entrée non trouvée en BDD')
        }
        setAlreadySubmitted(false)
      }
    } catch (error) {
      console.error('Error checking submission:', error)
      setAlreadySubmitted(false)
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
          ...formData,
          fingerprint,
          hasComputer: formData.hasComputer === 'yes'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setAlreadySubmitted(true)
          localStorage.setItem('survey_submitted', 'true')
          throw new Error('You have already submitted a response')
        }
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
      localStorage.setItem('survey_submitted', 'true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
          className="bg-white -2xl w-full max-w-md shadow-2xl"
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
                  className={`w-full text-left px-4 py-3 -xl transition-all ${
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
          className="bg-white -2xl shadow-lg p-8 max-w-md w-full text-center"
        >
           <div className="w-[120px]mx-auto bg-white -xl flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={124} 
                height={124}
                className="object-contain"
                onError={(e) => {
                  // Fallback si le logo n'existe pas
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
                    <FileDownloader/>
                      <ImageLink
        src="/taptouche.png"
        alt="tap Touche image"
        href="https://app.taptouche.com/"
        width={170}
       
      />

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Déjà soumis !</h1>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">
            Vous avez déjà participé à ce sondage!
          </p>
          
          <div className="mt-4 text-sm text-gray-500">
            Une seule réponse est autorisée par personne.
          </div>
        </motion.div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white -2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 -full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Merci !</h1>
          <p className="text-gray-600 mb-2">
            Votre réponse a été enregistrée avec succès.
          </p>
            <FileDownloader/>
  
      <ImageLink
        src="/taptouche.png"
        alt="tap Touche image"
        href="https://app.taptouche.com/"
        width={170}
       
      />
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen ">
      {/* Modals de sélection */}
      <AnimatePresence>
        {showComputerTypeModal && (
          <SelectModal
            key="computer-type-modal"
            isOpen={showComputerTypeModal}
            onClose={() => setShowComputerTypeModal(false)}
            title="Type d'ordinateur portable"
            options={computerTypes}
            selectedValue={formData.computerType}
            onSelect={(value: string) => setFormData({...formData, computerType: value})}
          />
        )}
        {showExpectedDateModal && (
          <SelectModal
            key="expected-date-modal"
            isOpen={showExpectedDateModal}
            onClose={() => setShowExpectedDateModal(false)}
            title="Période d'acquisition"
            options={expectedDates}
            selectedValue={formData.expectedDate}
            onSelect={(value: string) => setFormData({...formData, expectedDate: value})}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white -2xl  p-6 md:p-8 relative"
      >
        {/* En-tête avec logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-[120px] bg-white -xl flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={224} 
                height={224}
                className="object-contain"
                onError={(e) => {
                  // Fallback si le logo n'existe pas
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
          <h1 className="text-xl md:text-4xl font-bold text-blue-600 mb-2">
            Cours Bureautique ( Module Système d'exploitation )
          </h1>
          <p className="text-gray-600 text-lg">
            Sondage sur La possession de l'ordinateur  pour les Travaux Pratiques
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Nom de l'étudiant */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom complet de l'étudiant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.studentName}
              onChange={(e) => setFormData({...formData, studentName: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300"
              placeholder="Ex: Jean Dupont"
            />
          </div>

          {/* Avez-vous un ordinateur ? */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Avez-vous un ordinateur portable personnel ? <span className="text-red-500">*</span>
            </label>
            <div className="space-y- grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
                <input
                  type="radio"
                  name="hasComputer"
                  value="yes"
                  required
                  checked={formData.hasComputer === 'yes'}
                  onChange={(e) => setFormData({...formData, hasComputer: e.target.value})}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Oui, j'ai un ordinateur portable</span>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
                <input
                  type="radio"
                  name="hasComputer"
                  value="no"
                  checked={formData.hasComputer === 'no'}
                  onChange={(e) => setFormData({...formData, hasComputer: e.target.value})}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Non, je n'ai pas d'ordinateur portable</span>
              </label>
            </div>
          </div>

          {/* Si Oui - Type d'ordinateur */}
          <AnimatePresence mode="wait">
            {formData.hasComputer === 'yes' && (
              <motion.div
                key="computer-type-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type d'ordinateur portable <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowComputerTypeModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                >
                  {formData.computerType ? (
                    <span className="text-gray-700">
                      {computerTypes.find(t => t.value === formData.computerType)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-400">Sélectionnez le type de votre portable...</span>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  * Seuls les ordinateurs portables sont acceptés pour les travaux pratiques
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Si Non - Questions supplémentaires */}
          <AnimatePresence mode="wait">
            {formData.hasComputer === 'no' && (
              <motion.div
                key="no-computer-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Question: Prévoyez-vous d'en acquérir un ? */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Prévoyez-vous d'acquérir un ordinateur portable prochainement ? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
                      <input
                        type="radio"
                        name="planToGetComputer"
                        value="yes_soon"
                        required
                        checked={formData.planToGetComputer === 'yes_soon'}
                        onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">Oui, dans les prochains jours</span>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
                      <input
                        type="radio"
                        name="planToGetComputer"
                        value="yes_later"
                        checked={formData.planToGetComputer === 'yes_later'}
                        onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">Oui, mais plus tard dans le semestre</span>
                    </label>
                    <label className="flex items-center p-4 border-2 border-gray-200 -xl cursor-pointer hover:border-blue-300 transition-all">
                      <input
                        type="radio"
                        name="planToGetComputer"
                        value="no"
                        checked={formData.planToGetComputer === 'no'}
                        onChange={(e) => setFormData({...formData, planToGetComputer: e.target.value})}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">Non, je n'en prévois pas pour le moment</span>
                    </label>
                  </div>
                </div>

                {/* Si prévoit d'acheter - Date prévue */}
                <AnimatePresence mode="wait">
                  {(formData.planToGetComputer === 'yes_soon' || formData.planToGetComputer === 'yes_later') && (
                    <motion.div
                      key="expected-date-section"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quand pensez-vous l'acquérir ? <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowExpectedDateModal(true)}
                        className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-left"
                      >
                        {formData.expectedDate ? (
                          <span className="text-gray-700">
                            {expectedDates.find(d => d.value === formData.expectedDate)?.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sélectionnez une période...</span>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Question: Comment allez-vous faire la pratique ? */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comment comptez-vous effectuer les travaux pratiques sans ordinateur portable ? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.withoutComputerPlan}
                    onChange={(e) => setFormData({...formData, withoutComputerPlan: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 -xl focus:outline-none focus:border-blue-500 transition-all bg-white hover:border-gray-300 resize-none"
                    placeholder="Ex: Utiliser les ordinateurs de la bibliothèque, emprunter celui d'un ami, utiliser mon téléphone..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Votre réponse nous aidera à mieux comprendre vos besoins
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message d'erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border-2 border-red-200 text-red-700 p-4 -xl text-sm flex items-start"
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
            className="w-full bg-blue-600 text-white py-4 px-4 -xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md hover:shadow-lg text-lg"
          >
            {loading ? (
              <span className="flex items-center -none justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              'Soumettre ma réponse'
            )}
          </button>
            <FileDownloader/>
        </form>
      </motion.div>
    </main>
  )
}