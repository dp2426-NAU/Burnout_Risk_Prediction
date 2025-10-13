# Transformer Models for Time-Series - Created by Balaji Koneti
"""
Advanced transformer models for time-series burnout risk prediction.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, recall_score, precision_score
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class TimeSeriesDataset(Dataset):
    """Dataset class for time-series burnout prediction data."""
    
    def __init__(self, sequences: np.ndarray, targets: np.ndarray, sequence_length: int = 30):
        self.sequences = sequences
        self.targets = targets
        self.sequence_length = sequence_length
        
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        sequence = torch.FloatTensor(self.sequences[idx])
        target = torch.LongTensor([self.targets[idx]])
        return sequence, target

class PositionalEncoding(nn.Module):
    """Positional encoding for transformer models."""
    
    def __init__(self, d_model: int, max_len: int = 5000):
        super(PositionalEncoding, self).__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        return x + self.pe[:x.size(0), :]

class BurnoutTransformer(nn.Module):
    """Transformer model for burnout risk prediction from time-series data."""
    
    def __init__(self, 
                 input_dim: int,
                 d_model: int = 128,
                 nhead: int = 8,
                 num_layers: int = 6,
                 dim_feedforward: int = 512,
                 dropout: float = 0.1,
                 num_classes: int = 2,
                 sequence_length: int = 30):
        super(BurnoutTransformer, self).__init__()
        
        self.input_dim = input_dim
        self.d_model = d_model
        self.sequence_length = sequence_length
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, d_model)
        
        # Positional encoding
        self.pos_encoding = PositionalEncoding(d_model, sequence_length)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, num_classes)
        )
        
        # Attention weights for interpretability
        self.attention_weights = None
        
    def forward(self, x):
        # Input projection
        x = self.input_projection(x)  # (batch_size, seq_len, d_model)
        
        # Add positional encoding
        x = x.transpose(0, 1)  # (seq_len, batch_size, d_model)
        x = self.pos_encoding(x)
        x = x.transpose(0, 1)  # (batch_size, seq_len, d_model)
        
        # Transformer encoding
        encoded = self.transformer_encoder(x)
        
        # Global average pooling
        pooled = encoded.mean(dim=1)  # (batch_size, d_model)
        
        # Classification
        output = self.classifier(pooled)
        
        return output
    
    def get_attention_weights(self, x):
        """Get attention weights for interpretability."""
        # This is a simplified version - in practice, you'd need to modify the forward pass
        # to capture attention weights from each layer
        x = self.input_projection(x)
        x = x.transpose(0, 1)
        x = self.pos_encoding(x)
        x = x.transpose(0, 1)
        
        # Store attention weights (simplified)
        self.attention_weights = torch.ones(x.size(0), x.size(1), x.size(1))
        
        return self.attention_weights

class BurnoutLSTM(nn.Module):
    """LSTM model for comparison with transformer."""
    
    def __init__(self, 
                 input_dim: int,
                 hidden_dim: int = 128,
                 num_layers: int = 2,
                 dropout: float = 0.1,
                 num_classes: int = 2):
        super(BurnoutLSTM, self).__init__()
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_classes)
        )
    
    def forward(self, x):
        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Use the last output
        last_output = lstm_out[:, -1, :]
        
        # Classification
        output = self.classifier(last_output)
        
        return output

class TransformerTrainer:
    """Trainer class for transformer models."""
    
    def __init__(self, model: nn.Module, config: Dict[str, Any]):
        self.model = model
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
        # Training configuration
        self.learning_rate = config.get('learning_rate', 0.001)
        self.batch_size = config.get('batch_size', 32)
        self.num_epochs = config.get('num_epochs', 100)
        self.patience = config.get('patience', 10)
        
        # Optimizer and loss
        self.optimizer = optim.AdamW(self.model.parameters(), lr=self.learning_rate, weight_decay=0.01)
        self.criterion = nn.CrossEntropyLoss()
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.5, patience=5, verbose=True
        )
        
        # Training history
        self.train_losses = []
        self.val_losses = []
        self.train_metrics = []
        self.val_metrics = []
        
    def train_epoch(self, train_loader: DataLoader) -> Tuple[float, Dict[str, float]]:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0
        all_predictions = []
        all_targets = []
        
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(self.device), target.to(self.device)
            target = target.squeeze()
            
            self.optimizer.zero_grad()
            output = self.model(data)
            loss = self.criterion(output, target)
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Collect predictions for metrics
            predictions = torch.argmax(output, dim=1)
            all_predictions.extend(predictions.cpu().numpy())
            all_targets.extend(target.cpu().numpy())
        
        avg_loss = total_loss / len(train_loader)
        
        # Calculate metrics
        metrics = self._calculate_metrics(all_targets, all_predictions)
        
        return avg_loss, metrics
    
    def validate_epoch(self, val_loader: DataLoader) -> Tuple[float, Dict[str, float]]:
        """Validate for one epoch."""
        self.model.eval()
        total_loss = 0
        all_predictions = []
        all_targets = []
        
        with torch.no_grad():
            for data, target in val_loader:
                data, target = data.to(self.device), target.to(self.device)
                target = target.squeeze()
                
                output = self.model(data)
                loss = self.criterion(output, target)
                
                total_loss += loss.item()
                
                predictions = torch.argmax(output, dim=1)
                all_predictions.extend(predictions.cpu().numpy())
                all_targets.extend(target.cpu().numpy())
        
        avg_loss = total_loss / len(val_loader)
        metrics = self._calculate_metrics(all_targets, all_predictions)
        
        return avg_loss, metrics
    
    def _calculate_metrics(self, targets: List[int], predictions: List[int]) -> Dict[str, float]:
        """Calculate evaluation metrics."""
        return {
            'accuracy': accuracy_score(targets, predictions),
            'f1_score': f1_score(targets, predictions, average='weighted'),
            'recall': recall_score(targets, predictions, average='weighted'),
            'precision': precision_score(targets, predictions, average='weighted')
        }
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader) -> Dict[str, Any]:
        """Train the model."""
        logger.info(f"Starting training on device: {self.device}")
        
        best_val_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(self.num_epochs):
            # Training
            train_loss, train_metrics = self.train_epoch(train_loader)
            
            # Validation
            val_loss, val_metrics = self.validate_epoch(val_loader)
            
            # Update learning rate
            self.scheduler.step(val_loss)
            
            # Store history
            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)
            self.train_metrics.append(train_metrics)
            self.val_metrics.append(val_metrics)
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                # Save best model
                torch.save(self.model.state_dict(), 'best_transformer_model.pth')
            else:
                patience_counter += 1
            
            # Log progress
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
                logger.info(f"Train Metrics: {train_metrics}")
                logger.info(f"Val Metrics: {val_metrics}")
            
            # Early stopping
            if patience_counter >= self.patience:
                logger.info(f"Early stopping at epoch {epoch}")
                break
        
        # Load best model
        self.model.load_state_dict(torch.load('best_transformer_model.pth'))
        
        return {
            'best_val_loss': best_val_loss,
            'final_train_metrics': self.train_metrics[-1],
            'final_val_metrics': self.val_metrics[-1],
            'epochs_trained': epoch + 1
        }

class AdvancedModelPipeline:
    """Pipeline for advanced transformer-based burnout prediction."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.scaler = StandardScaler()
        self.model = None
        self.trainer = None
        
    def prepare_time_series_data(self, data: pd.DataFrame, user_id_col: str = 'user_id', 
                                target_col: str = 'burnout_risk', sequence_length: int = 30) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare time-series data for transformer training."""
        try:
            logger.info("Preparing time-series data for transformer training...")
            
            # Sort by user and timestamp
            data = data.sort_values([user_id_col, 'timestamp'])
            
            sequences = []
            targets = []
            
            # Group by user
            for user_id, user_data in data.groupby(user_id_col):
                if len(user_data) < sequence_length:
                    continue
                
                # Extract features (exclude user_id and target)
                feature_cols = [col for col in user_data.columns if col not in [user_id_col, target_col, 'timestamp']]
                user_features = user_data[feature_cols].values
                
                # Create sequences
                for i in range(len(user_features) - sequence_length + 1):
                    sequence = user_features[i:i + sequence_length]
                    target = user_data[target_col].iloc[i + sequence_length - 1]
                    
                    sequences.append(sequence)
                    targets.append(target)
            
            sequences = np.array(sequences)
            targets = np.array(targets)
            
            logger.info(f"Created {len(sequences)} sequences of length {sequence_length}")
            return sequences, targets
            
        except Exception as e:
            logger.error(f"Error preparing time-series data: {str(e)}")
            raise
    
    def train_transformer_model(self, sequences: np.ndarray, targets: np.ndarray, 
                              test_size: float = 0.2) -> Dict[str, Any]:
        """Train transformer model on time-series data."""
        try:
            logger.info("Training transformer model...")
            
            # Split data
            from sklearn.model_selection import train_test_split
            X_train, X_val, y_train, y_val = train_test_split(
                sequences, targets, test_size=test_size, random_state=42, stratify=targets
            )
            
            # Create datasets
            train_dataset = TimeSeriesDataset(X_train, y_train, sequences.shape[1])
            val_dataset = TimeSeriesDataset(X_val, y_val, sequences.shape[1])
            
            # Create data loaders
            train_loader = DataLoader(train_dataset, batch_size=self.config.get('batch_size', 32), shuffle=True)
            val_loader = DataLoader(val_dataset, batch_size=self.config.get('batch_size', 32), shuffle=False)
            
            # Initialize model
            input_dim = sequences.shape[2]
            self.model = BurnoutTransformer(
                input_dim=input_dim,
                d_model=self.config.get('d_model', 128),
                nhead=self.config.get('nhead', 8),
                num_layers=self.config.get('num_layers', 6),
                dim_feedforward=self.config.get('dim_feedforward', 512),
                dropout=self.config.get('dropout', 0.1),
                num_classes=len(np.unique(targets)),
                sequence_length=sequences.shape[1]
            )
            
            # Initialize trainer
            self.trainer = TransformerTrainer(self.model, self.config)
            
            # Train model
            training_results = self.trainer.train(train_loader, val_loader)
            
            logger.info("Transformer model training completed")
            return training_results
            
        except Exception as e:
            logger.error(f"Error training transformer model: {str(e)}")
            raise
    
    def train_lstm_model(self, sequences: np.ndarray, targets: np.ndarray, 
                        test_size: float = 0.2) -> Dict[str, Any]:
        """Train LSTM model for comparison."""
        try:
            logger.info("Training LSTM model...")
            
            # Split data
            from sklearn.model_selection import train_test_split
            X_train, X_val, y_train, y_val = train_test_split(
                sequences, targets, test_size=test_size, random_state=42, stratify=targets
            )
            
            # Create datasets
            train_dataset = TimeSeriesDataset(X_train, y_train, sequences.shape[1])
            val_dataset = TimeSeriesDataset(X_val, y_val, sequences.shape[1])
            
            # Create data loaders
            train_loader = DataLoader(train_dataset, batch_size=self.config.get('batch_size', 32), shuffle=True)
            val_loader = DataLoader(val_dataset, batch_size=self.config.get('batch_size', 32), shuffle=False)
            
            # Initialize model
            input_dim = sequences.shape[2]
            self.model = BurnoutLSTM(
                input_dim=input_dim,
                hidden_dim=self.config.get('hidden_dim', 128),
                num_layers=self.config.get('num_layers', 2),
                dropout=self.config.get('dropout', 0.1),
                num_classes=len(np.unique(targets))
            )
            
            # Initialize trainer
            self.trainer = TransformerTrainer(self.model, self.config)
            
            # Train model
            training_results = self.trainer.train(train_loader, val_loader)
            
            logger.info("LSTM model training completed")
            return training_results
            
        except Exception as e:
            logger.error(f"Error training LSTM model: {str(e)}")
            raise
    
    def predict(self, sequences: np.ndarray) -> np.ndarray:
        """Make predictions using the trained model."""
        try:
            if self.model is None:
                raise ValueError("Model not trained yet")
            
            self.model.eval()
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            
            predictions = []
            
            with torch.no_grad():
                for sequence in sequences:
                    sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0).to(device)
                    output = self.model(sequence_tensor)
                    prediction = torch.argmax(output, dim=1).cpu().numpy()[0]
                    predictions.append(prediction)
            
            return np.array(predictions)
            
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise
    
    def get_attention_weights(self, sequences: np.ndarray) -> np.ndarray:
        """Get attention weights for model interpretability."""
        try:
            if self.model is None or not hasattr(self.model, 'get_attention_weights'):
                raise ValueError("Model not trained or doesn't support attention weights")
            
            self.model.eval()
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            
            attention_weights = []
            
            with torch.no_grad():
                for sequence in sequences:
                    sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0).to(device)
                    weights = self.model.get_attention_weights(sequence_tensor)
                    attention_weights.append(weights.cpu().numpy())
            
            return np.array(attention_weights)
            
        except Exception as e:
            logger.error(f"Error getting attention weights: {str(e)}")
            raise

