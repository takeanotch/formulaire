// app/admin/page.tsx
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
  Cpu,
  HardDrive
} from 'lucide-react'
import Link from 'next/link'

interface SurveyResponse {
  id: string
  created_at: string
  cpu_cores: string
  ram: string
  storage_space: string
  storage_type: string
  architecture: string
  virtualization: boolean
  fingerprint: string
  ip_address: string
}

interface Stats {
  total: number
  uniqueVisitors: number
  cpuDistribution: { name: string; value: number }[]
  ramDistribution: { name: string; value: number }[]
  storageTypeDistribution: { name: string; value: number }[]
  architectureDistribution: { name: string; value: number }[]
  virtualizationSupport: { name: string; value: number }[]
  recentResponses: SurveyResponse[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

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
    const uniqueVisitors = new Set(responses.map(r => r.fingerprint)).size

    // Distribution CPU
    const cpuMap: Record<string, number> = {}
    responses.forEach(r => {
      const cpu = formatCpu(r.cpu_cores)
      cpuMap[cpu] = (cpuMap[cpu] || 0) + 1
    })
    const cpuDistribution = Object.entries(cpuMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution RAM
    const ramMap: Record<string, number> = {}
    responses.forEach(r => {
      const ram = formatRam(r.ram)
      ramMap[ram] = (ramMap[ram] || 0) + 1
    })
    const ramDistribution = Object.entries(ramMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution Stockage
    const storageTypeMap: Record<string, number> = {}
    responses.forEach(r => {
      const storage = formatStorageType(r.storage_type)
      storageTypeMap[storage] = (storageTypeMap[storage] || 0) + 1
    })
    const storageTypeDistribution = Object.entries(storageTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution Architecture
    const archMap: Record<string, number> = {}
    responses.forEach(r => {
      const arch = formatArchitecture(r.architecture)
      archMap[arch] = (archMap[arch] || 0) + 1
    })
    const architectureDistribution = Object.entries(archMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Support virtualisation
    const virtSupport = responses.filter(r => r.virtualization).length
    const noVirtSupport = total - virtSupport
    const virtualizationSupport = [
      { name: 'Supportée', value: virtSupport },
      { name: 'Non supportée', value: noVirtSupport }
    ]

    return {
      total,
      uniqueVisitors,
      cpuDistribution,
      ramDistribution,
      storageTypeDistribution,
      architectureDistribution,
      virtualizationSupport,
      recentResponses: responses.slice(0, 120)
    }
  }

  const formatCpu = (cpu: string): string => {
    const cpus: Record<string, string> = {
      '2_cores': '2 cœurs',
      '4_cores': '4 cœurs',
      '6_cores': '6 cœurs',
      '8_cores': '8 cœurs',
      '8plus_cores': '8+ cœurs',
      'unknown': 'Inconnu'
    }
    return cpus[cpu] || cpu
  }

  const formatRam = (ram: string): string => {
    const rams: Record<string, string> = {
      '4GB': '4 Go',
      '8GB': '8 Go',
      '16GB': '16 Go',
      '32GB': '32 Go',
      '32GB_plus': '32 Go+',
      'unknown': 'Inconnu'
    }
    return rams[ram] || ram
  }

  const formatStorageType = (type: string): string => {
    const types: Record<string, string> = {
      'SSD': 'SSD',
      'HDD': 'HDD',
      'NVMe': 'NVMe',
      'unknown': 'Inconnu'
    }
    return types[type] || type
  }

  const formatArchitecture = (arch: string): string => {
    const archs: Record<string, string> = {
      '64-bit': '64 bits',
      '32-bit': '32 bits',
      'ARM': 'ARM',
      'unknown': 'Inconnu'
    }
    return archs[arch] || arch
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
        'CPU': formatCpu(r.cpu_cores),
        'RAM': formatRam(r.ram),
        'Stockage Espace': r.storage_space,
        'Stockage Type': formatStorageType(r.storage_type),
        'Architecture': formatArchitecture(r.architecture),
        'Virtualisation': r.virtualization ? 'Oui' : 'Non',
        'IP': r.ip_address || '-'
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
              <h2 className="text-2xl font-light tracking-wide text-gray-900">Administration (MOT DE PASSE : admin2024)</h2>
              <p className="text-sm text-gray-500 mt-1">Dashboard sondage configuration</p>
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
                  {stats?.total || 0} participations
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-gray-200 p-4">
                <div className="text-2xl font-light">{stats.total}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Monitor size={12} />
                  Participations totales
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4">
                <div className="text-2xl font-light text-purple-700">{stats.uniqueVisitors}</div>
                <div className="text-xs text-purple-600 mt-1">Visiteurs uniques</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* CPU Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Cpu size={16} />
                  Distribution CPU
                </h3>
                {stats.cpuDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.cpuDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.cpuDistribution.map((entry, index) => (
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

              {/* RAM Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <HardDrive size={16} />
                  Distribution RAM
                </h3>
                {stats.ramDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.ramDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.ramDistribution.map((entry, index) => (
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

              {/* Storage Type Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Type de stockage
                </h3>
                {stats.storageTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.storageTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.storageTypeDistribution.map((entry, index) => (
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

              {/* Architecture Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Architecture
                </h3>
                {stats.architectureDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.architectureDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.architectureDistribution.map((entry, index) => (
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

            {/* Virtualisation Chart */}
            <div className="bg-white border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Support de la virtualisation
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.virtualizationSupport}>
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
                <h3 className="text-sm font-medium text-gray-700">
                  Dernières participations ({stats?.total || 0})
                </h3>
              </div>
              
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        CPU
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        RAM
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Stockage
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Architecture
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Virtualisation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats?.recentResponses.map((response) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(response.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatCpu(response.cpu_cores)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatRam(response.ram)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {response.storage_space} - {formatStorageType(response.storage_type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatArchitecture(response.architecture)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 text-xs border ${
                            response.virtualization
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {response.virtualization ? 'Oui' : 'Non'}
                          </span>
                        </td>
                      </tr>
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