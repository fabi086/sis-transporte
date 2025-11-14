import React, { useState, useEffect } from 'react';
import { Truck, Database } from './icons';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AuthProps {
    onSetCredentials: (url: string, key: string) => void;
    supabase: SupabaseClient | null;
}

export const Auth: React.FC<AuthProps> = ({ onSetCredentials, supabase }) => {
    const [view, setView] = useState('signIn'); // signIn, signUp
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(!supabase);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        // Load credentials from local storage on mount
        const storedUrl = localStorage.getItem('reboque360_supabaseUrl') || '';
        const storedKey = localStorage.getItem('reboque360_supabaseKey') || '';
        setSupabaseUrl(storedUrl);
        setSupabaseKey(storedKey);
        setIsConfiguring(!storedUrl || !storedKey);
    }, []);

    const handleConfigSave = () => {
        if (!supabaseUrl || !supabaseKey) {
            setError("URL e Chave do Supabase são obrigatórios.");
            return;
        }
        onSetCredentials(supabaseUrl, supabaseKey);
        setIsConfiguring(false);
        setError(null);
    };

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) {
            setError("A configuração do Supabase é necessária antes de autenticar.");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        if (view === 'signUp') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        companyName,
                    }
                }
            });
            if (error) {
                setError(error.message);
            } else {
                setMessage("Cadastro realizado com sucesso! Você já pode entrar.");
            }
        } else { // signIn
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                 if (error.message === 'Invalid login credentials') {
                    setError('Credenciais de login inválidas. Por favor, verifique seu e-mail e senha.');
                } else {
                    setError(error.message);
                }
            }
            // On success, the onAuthStateChange in App.tsx will handle the session update
        }
        setLoading(false);
    };
    
    const inputClasses = "w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-900 mt-2 border focus:border-blue-500 focus:bg-white focus:outline-none placeholder-gray-500";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center mb-4">
                        <Truck className="h-12 w-12 text-brand-blue-700" />
                        <h1 className="ml-3 text-4xl font-bold text-gray-800">Reboque360</h1>
                    </div>
                    <p className="text-gray-600">Sua plataforma de gestão completa.</p>
                </div>

                {isConfiguring ? (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-center text-gray-700">Configuração do Banco de Dados</h3>
                        <p className="text-sm text-center text-gray-500">
                           Para começar, insira as credenciais do seu projeto Supabase. Você pode encontrá-las em Project Settings {'>'} API no seu painel do Supabase.
                        </p>
                         <div className="text-xs text-center text-yellow-700 bg-yellow-100 p-2 rounded-md">
                            <strong>Aviso:</strong> As chaves são salvas no seu navegador. Para um ambiente de produção seguro, use variáveis de ambiente no servidor.
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Supabase URL</label>
                            <input type="url" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} placeholder="https://<id>.supabase.co" className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Supabase Anon Key</label>
                            <input type="text" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} placeholder="eyJhbGciOi..." className={inputClasses} />
                        </div>
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        <button onClick={handleConfigSave} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                            Salvar Configuração
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex border-b">
                            <button onClick={() => setView('signIn')} className={`flex-1 py-2 font-semibold ${view === 'signIn' ? 'border-b-2 border-brand-blue-600 text-brand-blue-600' : 'text-gray-500'}`}>Entrar</button>
                            <button onClick={() => setView('signUp')} className={`flex-1 py-2 font-semibold ${view === 'signUp' ? 'border-b-2 border-brand-blue-600 text-brand-blue-600' : 'text-gray-500'}`}>Cadastrar</button>
                        </div>
                        <form onSubmit={handleAuthAction} className="space-y-4">
                            {view === 'signUp' && (
                                <>
                                    <input type="text" placeholder="Seu Nome" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                                    <input type="text" placeholder="Nome da Empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClasses} required />
                                </>
                            )}
                            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                            
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            {message && <p className="text-sm text-green-600 text-center">{message}</p>}

                            <button type="submit" disabled={loading} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400">
                                {loading ? 'Carregando...' : (view === 'signIn' ? 'Entrar' : 'Criar Conta')}
                            </button>
                        </form>
                         <button onClick={() => setIsConfiguring(true)} className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-brand-blue-700 mt-4">
                            <Database className="w-4 h-4 mr-2" />
                            Alterar Configuração do Banco de Dados
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};