import React from 'react';
import './PrivacyPolicyModal.css';

const PrivacyPolicyModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Política de Privacidade</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
            <p><strong>Última atualização:</strong> 12 de novembro de 2025</p>

            <h3>1. Introdução</h3>
            <p>
              A Five-SaaS ("nós", "nosso") opera o serviço de emissão e gerenciamento de notas fiscais. Esta página informa sobre nossas políticas em relação à coleta, uso e divulgação de dados pessoais quando você utiliza nosso Serviço.
            </p>

            <h3>2. Coleta e Uso de Informações</h3>
            <p>
              Coletamos vários tipos de informações para diversos fins, a fim de fornecer e melhorar nosso Serviço para você.
            </p>
            <h4>Tipos de Dados Coletados</h4>
            <ul>
              <li><strong>Dados Pessoais:</strong> Ao usar nosso Serviço, podemos solicitar que você nos forneça algumas informações de identificação pessoal que podem ser usadas para contatá-lo ou identificá-lo ("Dados Pessoais"). Isso pode incluir, mas não se limita a: email, nome, dados da empresa (CNPJ, Inscrição Estadual/Municipal), endereço e telefone.</li>
              <li><strong>Dados de Uso:</strong> Podemos coletar informações sobre como o Serviço é acessado e usado ("Dados de Uso"). Estes Dados de Uso podem incluir informações como o endereço de Protocolo de Internet do seu computador (por exemplo, endereço IP), tipo de navegador, versão do navegador, as páginas do nosso Serviço que você visita, a hora e a data da sua visita, o tempo gasto nessas páginas e outros dados de diagnóstico.</li>
              <li><strong>Cookies:</strong> Usamos cookies e tecnologias de rastreamento semelhantes para rastrear a atividade em nosso Serviço e manter certas informações.</li>
            </ul>

            <h3>3. Uso dos Dados</h3>
            <p>A Five-SaaS usa os dados coletados para diversos fins:</p>
            <ul>
              <li>Para fornecer e manter nosso Serviço;</li>
              <li>Para notificá-lo sobre alterações em nosso Serviço;</li>
              <li>Para fornecer suporte ao cliente;</li>
              <li>Para monitorar o uso de nosso Serviço;</li>
              <li>Para detectar, prevenir e resolver problemas técnicos.</li>
            </ul>

            <h3>4. Segurança dos Dados</h3>
            <p>
              A segurança de seus dados é importante para nós, mas lembre-se de que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Embora nos esforcemos para usar meios comercialmente aceitáveis para proteger seus Dados Pessoais, não podemos garantir sua segurança absoluta.
            </p>

            <h3>5. Contate-nos</h3>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: contato@5saas.com.br
            </p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
