// Script para atualizar usuário para administrador via browser
// Execute este código no console do navegador (F12)

(async function updateUserToAdmin() {
    try {
        // Importar o cliente Supabase (assumindo que está disponível globalmente)
        const { supabase } = window;
        
        if (!supabase) {
            console.error('Supabase não encontrado. Execute na página da aplicação.');
            return;
        }

        // Atualizar o usuário para administrador
        const { data, error } = await supabase
            .from('user_profiles')
            .update({ user_role: 'administrador' })
            .eq('email', 'euclideslione@gmail.com')
            .select();

        if (error) {
            console.error('Erro ao atualizar usuário:', error);
            return;
        }

        console.log('✅ Usuário atualizado com sucesso:', data);
        console.log('🔄 Recarregue a página para ver as mudanças');
        
        return data;
    } catch (error) {
        console.error('Erro na execução:', error);
    }
})();