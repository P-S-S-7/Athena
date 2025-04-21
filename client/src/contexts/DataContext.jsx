import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import agentService from "@/services/agentService";
import contactService from "@/services/contactService";
import ticketService from "@/services/ticketService";
import companyService from '@/services/companyService';
import groupService from "@/services/groupService";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [dataLoaded, setDataLoaded] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const [statusMap, setStatusMap] = useState({});
    const [priorityMap, setPriorityMap] = useState({});
    const [sourceMap, setSourceMap] = useState({});
    const [typeArray, setTypeArray] = useState([]);
    const [agentMap, setAgentMap] = useState({});
    const [contactMap, setContactMap] = useState({});
    const [contactEmailMap, setContactEmailMap] = useState({});
    const [groupMap, setGroupMap] = useState({});
    const [agentEmailMap, setAgentEmailMap] = useState({});
    const [companyMap, setCompanyMap] = useState({});

    const [healthScoreMap, setHealthScoreMap] = useState({});
    const [accountTierMap, setAccountTierMap] = useState({});
    const [industryMap, setIndustryMap] = useState({});

    const loadAllData = async () => {
        if (!isAuthenticated || dataLoading || dataLoaded) return;

        setDataLoading(true);

        try {
            const ticket_fields = await ticketService.getTicketFields();

            const newStatusMap = {};
            const newPriorityMap = {};
            const newSourceMap = {};
            const newTypeArray = [];

            ticket_fields.forEach(field => {
                if (field.name === 'status') {
                    Object.keys(field.choices).forEach(key => {
                        newStatusMap[parseInt(key)] = field.choices[key][0];
                    });
                } else if (field.name === 'priority') {
                    Object.keys(field.choices).forEach(key => {
                        newPriorityMap[field.choices[key]] = key;
                    });
                } else if (field.name === 'source') {
                    Object.keys(field.choices).forEach(key => {
                        newSourceMap[field.choices[key]] = key;
                    });
                } else if (field.name === 'ticket_type') {
                    newTypeArray.push(...field.choices);
                }
            });

            setStatusMap(newStatusMap);
            setPriorityMap(newPriorityMap);
            setSourceMap(newSourceMap);
            setTypeArray(newTypeArray);

            const groups = await groupService.getGroups();
            const newGroupMap = {};
            groups.forEach(group => {
                newGroupMap[group.id] = group.name;
            });
            setGroupMap(newGroupMap);

            const agents = await agentService.getAgents();
            const newAgentMap = {};
            agents.forEach(agent => {
                newAgentMap[agent.id] = agent.name;
            });
            setAgentMap(newAgentMap);

            const newHealthScoreMap = {};
            const newAccountTierMap = {};
            const newIndustryMap = {};
            const company_fields = await companyService.getCompanyFields();

            company_fields.forEach(field => {
                if (field.name === 'health_score') {
                    Object.keys(field.choices).forEach(key => {
                        newHealthScoreMap[field.choices[key]] = key;
                    });
                } else if (field.name === 'account_tier') {
                    Object.keys(field.choices).forEach(key => {
                        newAccountTierMap[field.choices[key]] = key;
                    });
                } else if (field.name === 'industry') {
                    Object.keys(field.choices).forEach(key => {
                        newIndustryMap[field.choices[key]] = key;
                    });
                }
            }
            );
            setHealthScoreMap(newHealthScoreMap);
            setAccountTierMap(newAccountTierMap);
            setIndustryMap(newIndustryMap);

            const contactResponse = await contactService.getContacts();
            const newContactMap = contactResponse.contacts.reduce((acc, contact) => {
                acc[contact.id] = contact.name;
                return acc;
            }, {});

            const newContactEmailMap = contactResponse.contacts.reduce((acc, contact) => {
                acc[contact.id] = contact.email;
                return acc;
            }, {});

            setContactMap(newContactMap);
            setContactEmailMap(newContactEmailMap);

            const agentResponse = await agentService.getAgents();
            const newAgentEmailMap = agentResponse.reduce((acc, agent) => {
                acc[agent.id] = agent.email;
                return acc;
            }, {});

            setAgentEmailMap(newAgentEmailMap);

            const companyResponse = await companyService.getCompanies();
            const newCompanyMap = companyResponse.companies.reduce((acc, company) => {
                acc[company.id] = company.name;
                return acc;
            }, {});

            setCompanyMap(newCompanyMap);

            setDataLoaded(true);
        } catch (error) {
            console.error("Error loading application data:", error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setDataLoaded(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && !dataLoaded && !dataLoading) {
            loadAllData();
        }
    }, [isAuthenticated, dataLoaded, dataLoading]);

    const value = {
        dataLoaded,
        dataLoading,
        loadAllData,
        statusMap,
        priorityMap,
        sourceMap,
        typeArray,
        agentMap,
        contactMap,
        contactEmailMap,
        groupMap,
        agentEmailMap,
        companyMap,
        healthScoreMap,
        accountTierMap,
        industryMap,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === null) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
