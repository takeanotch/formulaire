'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import * as XLSX from 'xlsx'
import { 
  ChevronLeft, 
  Download,
  RefreshCw,
  LogOut,
  Monitor,
  Laptop,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface SurveyResponse {
  id: string
  created_at: string
  student_name: string
  has_computer: boolean
  computer_type: string | null
  plan_to_get_computer: string | null
  expected_date: string | null
  without_computer_plan: string | null
  fingerprint: string
}

interface Stats {
  total: number
  hasComputer: number
  noComputer: number
  uniqueVisitors: number
  computerTypes: { name: string; value: number }[]
  plans: { name: string; value: number }[]
  recentResponses: SurveyResponse[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2024'

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      loadStats()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      setIsAuthenticated(true)
      loadStats()
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
    setStats(null)
    setPassword('')
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedStats = processStats(responses || [])
      setStats(processedStats)
    } catch (error) {
      console.error('Erreur de chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const processStats = (responses: SurveyResponse[]): Stats => {
    const total = responses.length
    const hasComputer = responses.filter(r => r.has_computer).length
    const noComputer = total - hasComputer
    const uniqueVisitors = new Set(responses.map(r => r.fingerprint)).size

    // Types d'ordinateurs
    const computerTypesMap: Record<string, number> = {}
    responses
      .filter(r => r.has_computer && r.computer_type)
      .forEach(r => {
        const type = formatComputerType(r.computer_type!)
        computerTypesMap[type] = (computerTypesMap[type] || 0) + 1
      })
    const computerTypes = Object.entries(computerTypesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Plans d'acquisition
    const plansMap: Record<string, number> = {}
    responses
      .filter(r => !r.has_computer && r.plan_to_get_computer)
      .forEach(r => {
        const plan = formatPlan(r.plan_to_get_computer!)
        plansMap[plan] = (plansMap[plan] || 0) + 1
      })
    const plans = Object.entries(plansMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      total,
      hasComputer,
      noComputer,
      uniqueVisitors,
      computerTypes,
      plans,
      recentResponses: responses.slice(0, 120)
    }
  }

  const formatComputerType = (type: string): string => {
    const types: Record<string, string> = {
      'laptop_windows': 'Windows',
      'laptop_mac': 'MacBook',
      'laptop_linux': 'Linux',
      'laptop_chrome': 'Chromebook',
      'laptop_other': 'Autre'
    }
    return types[type] || type
  }

  const formatPlan = (plan: string): string => {
    const plans: Record<string, string> = {
      'yes_soon': 'Prochainement',
      'yes_later': 'Plus tard',
      'no': 'Pas prévu'
    }
    return plans[plan] || plan
  }

  const exportToExcel = async () => {
    if (!stats) return
    
    setExportLoading(true)
    try {
      const { data: responses } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (!responses) return

      const excelData = responses.map(r => ({
        'Date': new Date(r.created_at).toLocaleString('fr-FR'),
        'Nom': r.student_name,
        'A un ordinateur': r.has_computer ? 'Oui' : 'Non',
        'Type': r.computer_type ? formatComputerType(r.computer_type) : '-',
        'Plan': r.plan_to_get_computer ? formatPlan(r.plan_to_get_computer) : '-',
        'Solution sans ordi': r.without_computer_plan || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Réponses')
      XLSX.writeFile(wb, `sondage_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Erreur export:', error)
    } finally {
      setExportLoading(false)
    }
  }

  // Tooltip personnalisé sans erreur TypeScript
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">{payload[0].name}</p>
          <p className="text-sm font-light">
            {payload[0].value} réponse{payload[0].value > 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  // Page de connexion
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light tracking-wide text-gray-900">Administration</h2>
              <p className="text-sm text-gray-500 mt-1">Accès dashboard sondage</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors text-sm"
                autoFocus
              />
              
              {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
              )}
              
              <button
                type="submit"
                className="w-full bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors"
              >
                Se connecter
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw size={24} className="mx-auto text-gray-400 animate-spin mb-3" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-black transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-light tracking-wide text-gray-900">
                  Dashboard Sondage
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats?.total || 0} réponses
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadStats}
                className="p-2 text-gray-400 hover:text-black transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {stats && (
          <>
            {/* Stats Cards - Essentiel uniquement */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-white border border-gray-200 p-4">
                <div className="text-2xl font-light">{stats.total}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Users size={12} />
                  Total réponses
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-4">
                <div className="text-2xl font-light text-green-700">{stats.hasComputer}</div>
                <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <Monitor size={12} />
                  Avec ordinateur
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-4">
                <div className="text-2xl font-light text-yellow-700">{stats.noComputer}</div>
                <div className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                  <Laptop size={12} />
                  Sans ordinateur
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4">
                <div className="text-2xl font-light text-purple-700">
                  {((stats.hasComputer / stats.total) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-purple-600 mt-1">Taux possession</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Doughnut - Types d'ordinateurs */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Types d'ordinateurs
                </h3>
                {stats.computerTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.computerTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.computerTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>

              {/* Doughnut - Plans d'acquisition */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Plans d'acquisition
                </h3>
                {stats.plans.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.plans}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.plans.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart - Répartition */}
            <div className="bg-white border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Répartition globale
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Avec ordinateur', value: stats.hasComputer },
                  { name: 'Sans ordinateur', value: stats.noComputer },
                  { name: 'Visiteurs uniques', value: stats.uniqueVisitors }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

           {/* Tableau des réponses */}
<div className="bg-white border border-gray-200 mb-6">
  <div className="p-4 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-700">
        Toutes les réponses ({stats?.total || 0})
      </h3>
      <span className="text-xs text-gray-400">
        {stats?.uniqueVisitors || 0} visiteurs uniques
      </span>
    </div>
  </div>
  
  <div className="overflow-auto max-h-[600px]">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            Date
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            Nom
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            Ordinateur
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            Type
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
            Plan
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {stats?.recentResponses.map((response) => (
          <TableRow key={response.id} response={response} />
        ))}
      </tbody>
    </table>
  </div>
</div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportToExcel}
                disabled={exportLoading}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download size={14} />
                {exportLoading ? 'Export...' : 'Exporter Excel'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}



// Composant pour chaque ligne du tableau avec bouton + pour le commentaire
const TableRow = ({ response }: { response: SurveyResponse }) => {
  const [showComment, setShowComment] = useState(false)

  const formatComputerType = (type: string): string => {
    const types: Record<string, string> = {
      'laptop_windows': 'Windows',
      'laptop_mac': 'MacBook',
      'laptop_linux': 'Linux',
      'laptop_chrome': 'Chromebook',
      'laptop_other': 'Autre'
    }
    return types[type] || type
  }

  const formatPlan = (plan: string): string => {
    const plans: Record<string, string> = {
      'yes_soon': 'Prochainement',
      'yes_later': 'Plus tard',
      'no': 'Pas prévu'
    }
    return plans[plan] || plan
  }

  const hasComment = response.without_computer_plan && response.without_computer_plan.trim().length > 0

  return (
    <>
      <tr className="hover:bg-gray-50 group">
        <td className="px-2 py-3">
          {hasComment && (
            <button
              onClick={() => setShowComment(!showComment)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-all"
              title={showComment ? "Masquer le commentaire" : "Voir le commentaire"}
            >
              <span className={`text-lg transform transition-transform ${showComment ? 'rotate-45' : ''}`}>
                +
              </span>
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {new Date(response.created_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {response.student_name}
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={`px-2 py-0.5 text-xs border ${
            response.has_computer
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            {response.has_computer ? 'Oui' : 'Non'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {response.computer_type ? formatComputerType(response.computer_type) : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {response.plan_to_get_computer ? formatPlan(response.plan_to_get_computer) : '-'}
        </td>
      </tr>
      
      {/* Ligne de commentaire (affichée seulement si showComment est true) */}
      {showComment && hasComment && (
        <tr className="bg-gray-50 border-b border-gray-200">
          <td colSpan={6} className="px-4 py-3">
            <div className="ml-8 pl-4 border-l-2 border-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commentaire :
                </span>
                <p className="text-sm text-gray-700 italic">
                  "{response.without_computer_plan}"
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}