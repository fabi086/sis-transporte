import React, { useState } from 'react';
import { Truck } from './icons';
import { supabase } from '../lib/supabase'; // Import the pre-configured client

export const Auth: React.FC = () => {
    const [view, setView] = useState('signIn'); // signIn, signUp
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // If Supabase is not configured, show an error message to the developer.
    if (!supabase) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração</h1>
                    <p className="text-gray-700">
                        As credenciais do Supabase não foram encontradas. Por favor, edite o arquivo 
                        <code className="bg-gray-200 text-sm p-1 rounded mx-1">lib/supabase.ts</code> 
                        e insira a URL e a Chave Anon do seu projeto.
                    </p>
                </div>
            </div>
        );
    }

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
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
                </>
            </div>
        </div>
    );
};