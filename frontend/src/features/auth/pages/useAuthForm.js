import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';

export const useAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  
  const { showToast } = useToast();
  const setError = (msg) => { if (msg) showToast(msg, 'error'); };
  
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationMessage, setShowActivationMessage] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, hasLength: false, hasLetter: false, hasNumber: false });

  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowActivationMessage(false);
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!formData.username.trim()) {
          throw new Error(t('usernameRequired') || 'Username is required');
        }
        if (!formData.password.trim()) {
          throw new Error(t('passwordRequired') || 'Password is required');
        }
        
        await login(formData.username, formData.password);
        navigate('/chat');
      } else {
        if (!formData.username.trim()) {
          throw new Error(t('usernameRequired') || 'Username is required');
        }
        if (!formData.email.trim()) {
          throw new Error(t('emailRequired') || 'Email is required');
        }
        if (!formData.password.trim()) {
          throw new Error(t('passwordRequired') || 'Password is required');
        }
        if (!formData.fullName.trim()) {
          throw new Error(t('fullNameRequired') || 'Full name is required');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error(t('invalidEmailFormat') || 'Please enter a valid email address');
        }
        
        if (formData.password.length < 8) {
          throw new Error(t('passwordTooShort') || 'Password must be at least 8 characters');
        }
        
        const hasUpper = /[A-Z]/.test(formData.password);
        const hasLower = /[a-z]/.test(formData.password);
        const hasNumber = /\d/.test(formData.password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(formData.password);
        
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          throw new Error(t('passwordRequirements') || 'Password must contain uppercase, lowercase, number, and special character (e.g. TestPass123!)');
        }
        
        const result = await register(formData.username, formData.email, formData.password, formData.fullName);
        
        if (result.success || result.code === 1000 || result.code === 200) {
          setShowActivationMessage(true);
          resetForm();
          setTimeout(() => {
            setIsLogin(true);
            setShowActivationMessage(false);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const apiMsg = err.response?.data?.message;
      const apiCode = err.response?.data?.code;
      
      let msgKey = apiMsg || apiCode;
      if (apiCode === 1002 || apiMsg === 'User existed') msgKey = 'USER_EXISTED';
      if (apiCode === 1008 || apiMsg === 'Email already exists') msgKey = 'EMAIL_ALREADY_EXISTS';
      if (apiCode === 1004 || apiMsg === 'User not existed') msgKey = 'USER_NOT_FOUND';

      const displayMsg = msgKey ? (t(msgKey) || apiMsg || err.message) : (err.message || 'An unexpected error occurred');
      setError(displayMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      const hasLength = value.length >= 8;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value);
      const hasLetter = /[a-zA-Z]/.test(value);
      const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
      
      setPasswordStrength({
        isValid,
        hasLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
        hasLetter
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: ''
    });
    setError('');
    setShowActivationMessage(false);
    setPasswordStrength({ isValid: false, hasLength: false, hasLetter: false, hasNumber: false });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return {
    isLogin,
    setIsLogin,
    showPassword,
    setShowPassword,
    formData,
    isLoading,
    showActivationMessage,
    setShowActivationMessage,
    passwordStrength,
    handleGoogleLogin,
    handleSubmit,
    handleInputChange,
    toggleMode,
    t
  };
};
