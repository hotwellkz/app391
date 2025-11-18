import fs from 'fs';
import path from 'path';
import { Contact, ContactsStore, CreateContactRequest, UpdateContactRequest } from '../types/contact';

const CONTACTS_DIR = path.join(__dirname, '../../data');
const CONTACTS_FILE = path.join(CONTACTS_DIR, 'contacts.json');

// Создаем директорию для данных если её нет
if (!fs.existsSync(CONTACTS_DIR)) {
    fs.mkdirSync(CONTACTS_DIR, { recursive: true });
}

// Загрузка контактов из файла
export const loadContacts = (): ContactsStore => {
    try {
        if (fs.existsSync(CONTACTS_FILE)) {
            const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
            const contacts = JSON.parse(data) as ContactsStore;
            console.log(`📱 Contacts loaded: ${Object.keys(contacts).length} contacts`);
            return contacts;
        }
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
    }
    
    console.log('📱 No contacts file found, starting with empty contacts store');
    return {};
};

// Сохранение контактов в файл
export const saveContacts = (contacts: ContactsStore): boolean => {
    try {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
        console.log(`💾 Contacts saved: ${Object.keys(contacts).length} contacts`);
        return true;
    } catch (error) {
        console.error('❌ Error saving contacts:', error);
        return false;
    }
};

// Получение всех контактов
export const getAllContacts = (): ContactsStore => {
    return loadContacts();
};

// Получение контакта по ID
export const getContactById = (contactId: string): Contact | null => {
    const contacts = loadContacts();
    return contacts[contactId] || null;
};

// Создание нового контакта
export const createContact = (request: CreateContactRequest): Contact | null => {
    try {
        const contacts = loadContacts();
        const now = new Date().toISOString();
        
        // Проверяем, не существует ли уже контакт
        if (contacts[request.contactId]) {
            console.log(`⚠️  Contact already exists: ${request.contactId}`);
            return null;
        }
        
        const newContact: Contact = {
            contactId: request.contactId,
            customName: request.customName.trim(),
            createdAt: now,
            updatedAt: now
        };
        
        contacts[request.contactId] = newContact;
        
        if (saveContacts(contacts)) {
            console.log(`✅ Contact created: ${request.contactId} -> "${request.customName}"`);
            return newContact;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error creating contact:', error);
        return null;
    }
};

// Обновление контакта
export const updateContact = (contactId: string, request: UpdateContactRequest): Contact | null => {
    try {
        const contacts = loadContacts();
        
        if (!contacts[contactId]) {
            console.log(`⚠️  Contact not found: ${contactId}`);
            return null;
        }
        
        const updatedContact: Contact = {
            ...contacts[contactId],
            customName: request.customName.trim(),
            updatedAt: new Date().toISOString()
        };
        
        contacts[contactId] = updatedContact;
        
        if (saveContacts(contacts)) {
            console.log(`✅ Contact updated: ${contactId} -> "${request.customName}"`);
            return updatedContact;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error updating contact:', error);
        return null;
    }
};

// Удаление контакта
export const deleteContact = (contactId: string): boolean => {
    try {
        const contacts = loadContacts();
        
        if (!contacts[contactId]) {
            console.log(`⚠️  Contact not found for deletion: ${contactId}`);
            return false;
        }
        
        delete contacts[contactId];
        
        if (saveContacts(contacts)) {
            console.log(`✅ Contact deleted: ${contactId}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        return false;
    }
};

// Поиск контактов по имени
export const searchContacts = (query: string): ContactsStore => {
    try {
        const contacts = loadContacts();
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            return contacts;
        }
        
        const filteredContacts: ContactsStore = {};
        
        Object.entries(contacts).forEach(([contactId, contact]) => {
            if (
                contact.customName.toLowerCase().includes(searchTerm) ||
                contactId.includes(searchTerm)
            ) {
                filteredContacts[contactId] = contact;
            }
        });
        
        console.log(`🔍 Contacts search "${query}": ${Object.keys(filteredContacts).length} results`);
        return filteredContacts;
    } catch (error) {
        console.error('❌ Error searching contacts:', error);
        return {};
    }
};

// Получение статистики контактов
export const getContactsStats = () => {
    try {
        const contacts = loadContacts();
        const totalContacts = Object.keys(contacts).length;
        
        return {
            totalContacts,
            lastUpdated: fs.existsSync(CONTACTS_FILE) 
                ? fs.statSync(CONTACTS_FILE).mtime.toISOString() 
                : null
        };
    } catch (error) {
        console.error('❌ Error getting contacts stats:', error);
        return {
            totalContacts: 0,
            lastUpdated: null
        };
    }
}; 