import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Component/Navbar';
import { restaurantApi } from '../../services/restaurantApi';
import '../styles/RestaurantDashboard.css';

const initialProfileState = {
  name: '',
  ownerName: '',
  email: '',
  phone: '',
  cuisine: '',
  city: '',
  address: '',
  bio: '',
  logoUrl: ''
};

const initialMenuState = {
  name: '',
  category: '',
  price: '',
  description: '',
  imageUrl: '',
  isAvailable: true
};

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileState);
  const [menuItems, setMenuItems] = useState([]);
  const [menuForm, setMenuForm] = useState(initialMenuState);
  const [editingItemId, setEditingItemId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMenuItem, setSavingMenuItem] = useState(false);

  const restaurantToken = useMemo(
    () => localStorage.getItem('restaurantToken'),
    []
  );

  const resetMenuForm = useCallback(() => {
    setMenuForm(initialMenuState);
    setEditingItemId(null);
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('restaurantToken');
    localStorage.removeItem('restaurantProfile');
    navigate('/RagisterResturent', { replace: true });
  }, [navigate]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await restaurantApi.getProfile();
      const restaurant = response.restaurant || {};

      setProfile(restaurant);
      setMenuItems(restaurant.menuItems || []);
      setProfileForm({
        name: restaurant.name || '',
        ownerName: restaurant.ownerName || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        cuisine: restaurant.cuisine || '',
        city: restaurant.city || '',
        address: restaurant.address || '',
        bio: restaurant.bio || '',
        logoUrl: restaurant.logoUrl || ''
      });

      localStorage.setItem('restaurantProfile', JSON.stringify(restaurant));
    } catch (err) {
      console.error('Failed to fetch restaurant profile:', err);
      if (err.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(err.message || 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!restaurantToken) {
      handleUnauthorized();
      return;
    }

    fetchProfile();
  }, [restaurantToken, fetchProfile, handleUnauthorized]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMenuChange = (event) => {
    const { name, value, type, checked } = event.target;
    setMenuForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');

    try {
      const payload = {
        ownerName: profileForm.ownerName,
        phone: profileForm.phone,
        cuisine: profileForm.cuisine,
        city: profileForm.city,
        address: profileForm.address,
        bio: profileForm.bio,
        logoUrl: profileForm.logoUrl
      };

      const response = await restaurantApi.updateProfile(payload);
      setProfile(response.restaurant);
      showSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMenuSubmit = async (event) => {
    event.preventDefault();
    setSavingMenuItem(true);
    setError('');

    const payload = {
      ...menuForm,
      price: Number(menuForm.price)
    };

    if (Number.isNaN(payload.price) || payload.price <= 0) {
      setError('Please enter a valid price greater than zero');
      setSavingMenuItem(false);
      return;
    }

    try {
      let response;

      if (editingItemId) {
        response = await restaurantApi.updateMenuItem(editingItemId, payload);
        showSuccess('Menu item updated');
      } else {
        response = await restaurantApi.createMenuItem(payload);
        showSuccess('Menu item added');
      }

      const restaurant = response.restaurant;
      setProfile(restaurant);
      setMenuItems(restaurant.menuItems || []);
      resetMenuForm();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      setError(err.message || 'Failed to save menu item');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleMenuEdit = (item) => {
    setEditingItemId(item._id);
    setMenuForm({
      name: item.name || '',
      category: item.category || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false
    });
  };

  const handleMenuDelete = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) {
      return;
    }

    setError('');

    try {
      const response = await restaurantApi.deleteMenuItem(itemId);
      setProfile(response.restaurant);
      setMenuItems(response.restaurant.menuItems || []);
      showSuccess('Menu item removed');

      if (editingItemId === itemId) {
        resetMenuForm();
      }
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      setError(err.message || 'Failed to delete menu item');
    }
  };

  if (loading) {
    return (
      <div className="restaurant-dashboard loading-state">
        <Navbar />
        <div className="dashboard-spinner">Loading restaurant dashboard...</div>
      </div>
    );
  }

  if (!restaurantToken) {
    return null;
  }

  return (
    <div className="restaurant-dashboard">
      <Navbar />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Restaurant Dashboard</h1>
            <p>Manage your restaurant profile and menu offerings.</p>
          </div>
          {profile?.restaurantCode && (
            <div className="restaurant-code">
              <span>Your restaurant code</span>
              <strong>{profile.restaurantCode}</strong>
            </div>
          )}
        </header>

        {error && <div className="dashboard-alert error">{error}</div>}
        {successMessage && (
          <div className="dashboard-alert success">{successMessage}</div>
        )}

        <div className="dashboard-grid">
          <section className="dashboard-card profile-card">
            <h2>Profile information</h2>
            <form onSubmit={handleProfileSubmit} className="dashboard-form">
              <div className="form-row">
                <label>Restaurant name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-grid">
                <div className="form-row">
                  <label>Owner name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={profileForm.ownerName}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-row">
                  <label>Business email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-row">
                  <label>Contact number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-row">
                  <label>Cuisine type</label>
                  <input
                    type="text"
                    name="cuisine"
                    value={profileForm.cuisine}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-row">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-row">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-row">
                  <label>Logo URL</label>
                  <input
                    type="url"
                    name="logoUrl"
                    value={profileForm.logoUrl}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Restaurant bio</label>
                <textarea
                  name="bio"
                  rows="3"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell your customers about your restaurant"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-card menu-card">
            <div className="menu-card-header">
              <div>
                <h2>{editingItemId ? 'Edit menu item' : 'Add menu item'}</h2>
                <p>
                  {editingItemId
                    ? 'Update details and availability for this item.'
                    : 'Create new items to showcase on your menu.'}
                </p>
              </div>
              {editingItemId && (
                <button type="button" className="text-button" onClick={resetMenuForm}>
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handleMenuSubmit} className="dashboard-form">
              <div className="form-grid">
                <div className="form-row">
                  <label>Item name *</label>
                  <input
                    type="text"
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={menuForm.category}
                    onChange={handleMenuChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={menuForm.price}
                    onChange={handleMenuChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <label>Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={menuForm.imageUrl}
                    onChange={handleMenuChange}
                    placeholder="https://example.com/dish.jpg"
                  />
                </div>
              </div>

              <div className="form-row">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={menuForm.description}
                  onChange={handleMenuChange}
                  placeholder="Describe this dish for your customers"
                />
              </div>

              <div className="form-row checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={menuForm.isAvailable}
                    onChange={handleMenuChange}
                  />
                  Available for ordering
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingMenuItem}
                >
                  {savingMenuItem
                    ? editingItemId
                      ? 'Updating...'
                      : 'Adding...'
                    : editingItemId
                    ? 'Update item'
                    : 'Add item'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="dashboard-card menu-list">
          <div className="menu-list-header">
            <h2>Your menu items</h2>
            <span>{menuItems.length} items</span>
          </div>

          {menuItems.length === 0 ? (
            <div className="empty-state">
              <h3>No items yet</h3>
              <p>Add dishes to start receiving customer orders.</p>
            </div>
          ) : (
            <div className="menu-items-grid">
              {menuItems.map((item) => (
                <article key={item._id} className="menu-item-card">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="menu-item-image" />
                  ) : (
                    <div className="menu-item-placeholder">{item.name.charAt(0)}</div>
                  )}

                  <div className="menu-item-content">
                    <div className="menu-item-header">
                      <h3>{item.name}</h3>
                      <span className="menu-item-price">₹{Number(item.price).toFixed(2)}</span>
                    </div>

                    <div className="menu-item-meta">
                      <span className="menu-item-category">{item.category}</span>
                      <span
                        className={`availability-tag ${
                          item.isAvailable === false ? 'unavailable' : 'available'
                        }`}
                      >
                        {item.isAvailable === false ? 'Unavailable' : 'Available'}
                      </span>
                    </div>

                    {item.description && (
                      <p className="menu-item-description">{item.description}</p>
                    )}

                    <div className="menu-item-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => handleMenuEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-button danger"
                        onClick={() => handleMenuDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
